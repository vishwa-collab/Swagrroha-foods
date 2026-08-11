package com.swagrooha.controller;

import com.swagrooha.model.Order;
import com.swagrooha.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable String orderId) {
        Optional<Order> found = orderRepository.findById(orderId);
        if (found.isPresent()) {
            return ResponseEntity.ok(found.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
    }

    @GetMapping("/area/{areaName}")
    public ResponseEntity<List<Order>> getOrdersByArea(@PathVariable String areaName) {
        return ResponseEntity.ok(orderRepository.findByDeliveryArea(areaName));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            String orderId = (String) payload.get("orderId");
            Map<String, Object> customer = (Map<String, Object>) payload.get("customer");
            Map<String, Object> area = (Map<String, Object>) payload.get("area");
            Map<String, Object> deliveryDate = (Map<String, Object>) payload.get("deliveryDate");

            Double subtotal = ((Number) payload.get("subtotal")).doubleValue();
            Double deliveryCharge = ((Number) payload.get("deliveryCharge")).doubleValue();
            Double totalAmount = ((Number) payload.get("totalAmount")).doubleValue();

            String status = (String) payload.getOrDefault("status", "PLACED");

            Order newOrder = Order.builder()
                    .orderId(orderId)
                    .customerName((String) customer.get("name"))
                    .customerPhone((String) customer.get("phone"))
                    .deliveryArea((String) area.get("name"))
                    .customerAddress((String) customer.get("address"))
                    .subtotal(subtotal)
                    .deliveryCharge(deliveryCharge)
                    .totalAmount(totalAmount)
                    .deliveryDate((String) deliveryDate.get("formattedDate"))
                    .status(status)
                    .paymentStatus((String) payload.getOrDefault("paymentStatus", "PAID_PENDING_VERIFICATION"))
                    .utrNumber((String) payload.get("utrNumber"))
                    .paymentProof((String) payload.get("paymentProof"))
                    .build();

            Order saved = orderRepository.save(newOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String orderId, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        String newPaymentStatus = body.get("paymentStatus");
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            order.setStatus(newStatus);
            if (newPaymentStatus != null && !newPaymentStatus.isEmpty()) {
                order.setPaymentStatus(newPaymentStatus);
            }
            Order updated = orderRepository.save(order);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
    }
}
