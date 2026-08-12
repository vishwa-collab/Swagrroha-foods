package com.swagrooha.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String orderId;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    private String customerEmail;

    @Column(nullable = false)
    private String deliveryArea;

    @Column(nullable = false, length = 1000)
    private String customerAddress;

    @Column(nullable = false)
    private Double subtotal;

    @Column(nullable = false)
    private Double deliveryCharge;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    private String deliveryDate;

    // Status Stages: PLACED, PAYMENT_VERIFIED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
    @Column(nullable = false)
    private String status;

    // Payment Statuses: PENDING_VERIFICATION, VERIFIED_PAID, REJECTED
    @Column(nullable = false)
    private String paymentStatus;

    private String paymentMethod;

    // Payment Screenshot Base64 Image URL / proof
    @Lob
    @Column(columnDefinition = "TEXT")
    private String paymentProof;

    private String utrNumber;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "PLACED";
        }
        if (this.paymentStatus == null || this.paymentStatus.trim().isEmpty()) {
            this.paymentStatus = "PENDING_VERIFICATION";
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

