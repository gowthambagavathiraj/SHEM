package com.info.shems.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.info.shems.dto.ForgotPasswordRequest;
import com.info.shems.dto.LoginRequestDto;
import com.info.shems.dto.LoginResponseDto;
import com.info.shems.dto.OtpVerificationRequestDto;
import com.info.shems.dto.RegisterRequestDto;
import com.info.shems.dto.ResetPasswordRequest;
import com.info.shems.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    @Autowired
    private AuthService authService;

    // =========================
    // REGISTER
    // =========================
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequestDto request) {

        authService.register(request);
        return new ResponseEntity<>("User registered successfully", HttpStatus.CREATED);
    }

    // =========================
    // LOGIN - STEP 1 (Email + Password)
    // =========================
    @PostMapping("/login")
    public ResponseEntity<String> login(
            @Valid @RequestBody LoginRequestDto request) {

        authService.login(request);
        return ResponseEntity.ok("OTP sent to registered email");
    }

    // =========================
    // LOGIN - STEP 2 (OTP Verification)
    // =========================
    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponseDto> verifyOtp(
            @Valid @RequestBody OtpVerificationRequestDto request) {

        LoginResponseDto response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        System.out.println("Forgot password request for: " + request.getEmail());
        String message = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        System.out.println("Reset password request with token: " + request.getToken());
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }

}
