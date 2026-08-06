package com.swagrooha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PjrSwagroohaApplication {

    public static void main(String[] args) {
        SpringApplication.run(PjrSwagroohaApplication.class, args);
        System.out.println("=================================================");
        System.out.println("  PJR Swagrooha Foods Spring Boot Backend Started ");
        System.out.println("  Port: 8080 | H2 Console: http://localhost:8080/h2-console ");
        System.out.println("=================================================");
    }
}
