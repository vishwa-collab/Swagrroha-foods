-- Schema SQL DDL Script for PJR Swagrooha Foods SQL Database

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(150),
    delivery_area VARCHAR(100) NOT NULL,
    customer_address TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_date VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(100),
    utr_number VARCHAR(100),
    payment_proof TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    weight_label VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

