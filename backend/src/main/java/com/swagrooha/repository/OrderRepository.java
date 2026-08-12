package com.swagrooha.repository;

import com.swagrooha.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByDeliveryArea(String deliveryArea);
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o WHERE LOWER(o.orderId) = LOWER(:query) OR LOWER(o.customerPhone) = LOWER(:query) OR (o.utrNumber IS NOT NULL AND LOWER(o.utrNumber) = LOWER(:query))")
    List<Order> searchOrders(@Param("query") String query);
}

