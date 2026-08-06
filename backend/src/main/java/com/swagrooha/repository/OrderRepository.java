package com.swagrooha.repository;

import com.swagrooha.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByDeliveryArea(String deliveryArea);
    List<Order> findAllByOrderByCreatedAtDesc();
}
