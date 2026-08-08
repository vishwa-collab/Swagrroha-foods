package com.swagrooha.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            Double amount = ((Number) data.get("amount")).doubleValue();
            
            // Razorpay amount is in paise (rupees * 100)
            int amountInPaise = (int) (amount * 100);

            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);

            org.json.JSONObject orderRequest = new org.json.JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = razorpayClient.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            
            return ResponseEntity.ok(response);
            
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating Razorpay order: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data) {
        try {
            String razorpayOrderId = data.get("razorpay_order_id");
            String razorpayPaymentId = data.get("razorpay_payment_id");
            String razorpaySignature = data.get("razorpay_signature");
            String amountStr = data.get("amount");

            org.json.JSONObject options = new org.json.JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            boolean isSignatureValid = Utils.verifyPaymentSignature(options, keySecret);

            if (!isSignatureValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Invalid payment signature."));
            }

            // Verify the actual amount and status from Razorpay
            if (amountStr != null) {
                RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
                com.razorpay.Payment payment = razorpayClient.payments.fetch(razorpayPaymentId);
                
                int expectedAmountInPaise = (int) (Double.parseDouble(amountStr) * 100);
                int actualAmountInPaise = payment.get("amount");
                String status = payment.get("status");

                if (!"captured".equals(status)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("success", false, "message", "Payment is not captured. Status: " + status));
                }

                if (actualAmountInPaise != expectedAmountInPaise) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("success", false, "message", "Payment amount mismatch. Expected: " + expectedAmountInPaise + " paise, but got: " + actualAmountInPaise + " paise"));
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Payment verified successfully."));
            
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Error verifying signature: " + e.getMessage()));
        }
    }
}
