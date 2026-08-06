-- Sample initial orders data for PJR Swagrooha Foods DB
INSERT INTO orders (order_id, customer_name, customer_phone, delivery_area, customer_address, subtotal, delivery_charge, total_amount, delivery_date, payment_status, created_at)
VALUES ('PJR-108492', 'Ravi Kumar', '9876543210', 'LB Nagar', 'Plot 42, Green Hills Colony, LB Nagar', 540.00, 50.00, 590.00, 'Saturday, Aug 15', 'PAID_PENDING_VERIFICATION', CURRENT_TIMESTAMP);

INSERT INTO order_items (order_id, product_name, weight_label, unit_price, quantity)
VALUES ('PJR-108492', 'Classic Murukulu (Jantikalu)', '1 kg', 350.00, 1),
       ('PJR-108492', 'Homemade Motichoor / Besan Laddu', '500g', 190.00, 1);
