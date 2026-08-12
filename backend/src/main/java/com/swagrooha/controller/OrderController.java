package com.swagrooha.controller;

import com.swagrooha.model.Order;
import com.swagrooha.model.OrderItem;
import com.swagrooha.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    @GetMapping("/{query}")
    public ResponseEntity<?> getOrderByQuery(@PathVariable String query) {
        String trimmed = query.trim();
        List<Order> matches = orderRepository.searchOrders(trimmed);
        if (!matches.isEmpty()) {
            return ResponseEntity.ok(matches.get(0));
        }
        Optional<Order> found = orderRepository.findById(trimmed);
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
            if (orderId == null || orderId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "orderId is required"));
            }

            Map<String, Object> customer = (Map<String, Object>) payload.get("customer");
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Customer details are required"));
            }

            String customerName = (String) customer.get("name");
            String customerPhone = (String) customer.get("phone");
            String customerEmail = (String) customer.get("email");
            String customerAddress = (String) customer.get("address");

            Map<String, Object> area = (Map<String, Object>) payload.get("area");
            String deliveryArea = area != null ? (String) area.get("name") : (String) payload.get("deliveryArea");

            Object deliveryDateObj = payload.get("deliveryDate");
            String deliveryDateStr = "";
            if (deliveryDateObj instanceof Map) {
                deliveryDateStr = (String) ((Map<String, Object>) deliveryDateObj).get("formattedDate");
            } else if (deliveryDateObj instanceof String) {
                deliveryDateStr = (String) deliveryDateObj;
            }

            Double subtotal = payload.get("subtotal") != null ? ((Number) payload.get("subtotal")).doubleValue() : 0.0;
            Double deliveryCharge = payload.get("deliveryCharge") != null ? ((Number) payload.get("deliveryCharge")).doubleValue() : 0.0;
            Double totalAmount = payload.get("totalAmount") != null ? ((Number) payload.get("totalAmount")).doubleValue() : 0.0;

            String status = (String) payload.getOrDefault("status", "PLACED");
            String paymentStatus = (String) payload.getOrDefault("paymentStatus", "PENDING_VERIFICATION");

            List<Map<String, Object>> rawItems = (List<Map<String, Object>>) payload.get("items");
            List<OrderItem> orderItems = new ArrayList<>();
            if (rawItems != null) {
                for (Map<String, Object> itemMap : rawItems) {
                    String prodName = "";
                    if (itemMap.containsKey("productName")) {
                        prodName = (String) itemMap.get("productName");
                    } else if (itemMap.get("product") instanceof Map) {
                        Map<String, Object> prod = (Map<String, Object>) itemMap.get("product");
                        prodName = (String) prod.get("name");
                    }
                    String weightLabel = (String) itemMap.getOrDefault("selectedWeightLabel", itemMap.getOrDefault("weightLabel", ""));
                    Double unitPrice = itemMap.get("unitPrice") != null ? ((Number) itemMap.get("unitPrice")).doubleValue() : 0.0;
                    Integer quantity = itemMap.get("quantity") != null ? ((Number) itemMap.get("quantity")).intValue() : 1;

                    OrderItem item = OrderItem.builder()
                            .productName(prodName != null ? prodName : "")
                            .weightLabel(weightLabel != null ? weightLabel : "")
                            .unitPrice(unitPrice)
                            .quantity(quantity)
                            .build();
                    orderItems.add(item);
                }
            }

            Order newOrder = Order.builder()
                    .orderId(orderId)
                    .customerName(customerName != null ? customerName : "")
                    .customerPhone(customerPhone != null ? customerPhone : "")
                    .customerEmail(customerEmail)
                    .deliveryArea(deliveryArea != null ? deliveryArea : "")
                    .customerAddress(customerAddress != null ? customerAddress : "")
                    .subtotal(subtotal)
                    .deliveryCharge(deliveryCharge)
                    .totalAmount(totalAmount)
                    .deliveryDate(deliveryDateStr != null ? deliveryDateStr : "")
                    .status(status)
                    .paymentStatus(paymentStatus)
                    .paymentMethod((String) payload.get("paymentMethod"))
                    .utrNumber((String) payload.get("utrNumber"))
                    .paymentProof((String) payload.get("paymentProof"))
                    .items(orderItems)
                    .build();

            Order saved = orderRepository.save(newOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Failed to save order: " + e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String orderId, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        String newPaymentStatus = body.get("paymentStatus");

        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();

            // Terminal status check: DELIVERED cannot revert to PREPARING, READY, OUT_FOR_DELIVERY
            if ("DELIVERED".equals(order.getStatus())) {
                if (newStatus != null && !newStatus.equals("DELIVERED")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Order is already DELIVERED and cannot be changed back to active stages."));
                }
            }

            if (newStatus != null && !newStatus.trim().isEmpty()) {
                order.setStatus(newStatus);
            }
            if (newPaymentStatus != null && !newPaymentStatus.trim().isEmpty()) {
                order.setPaymentStatus(newPaymentStatus);
            }
            Order updated = orderRepository.save(order);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
    }
}

