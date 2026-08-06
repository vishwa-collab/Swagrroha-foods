package com.swagrooha.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final String OWNER_EMAIL = "vishwa81251@gmail.com";
    private static final String OWNER_PASSWORD = "81251";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (OWNER_EMAIL.equalsIgnoreCase(email) && OWNER_PASSWORD.equals(password)) {
            String token = "jwt_token_pjr_owner_" + System.currentTimeMillis();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "user", Map.of("email", OWNER_EMAIL, "role", "OWNER")
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "error", "Invalid Owner Credentials"));
    }
}
