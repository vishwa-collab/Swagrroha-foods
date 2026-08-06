package com.swagrooha.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
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

    // Status Stages: PLACED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String paymentStatus;

    // Payment Screenshot Base64 Image URL / proof
    @Lob
    @Column(length = 5000000)
    private String paymentProof;

    private String utrNumber;

    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "PLACED";
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = "PAID";
        }
    }
}
