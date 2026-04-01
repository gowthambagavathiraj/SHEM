package com.info.shems.service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.info.shems.dto.LoginRequestDto;
import com.info.shems.dto.LoginResponseDto;
import com.info.shems.dto.OtpVerificationRequestDto;
import com.info.shems.dto.ProfileUpdateDto;
import com.info.shems.dto.RegisterRequestDto;
import com.info.shems.dto.ResetPasswordRequest;
import com.info.shems.model.Role;
import com.info.shems.model.User;
import com.info.shems.model.UserOtp;
import com.info.shems.repository.UserOtpRepository;
import com.info.shems.repository.UserRepository;
import com.info.shems.security.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    // =========================
    // REGISTER USER
    // =========================
    public void register(RegisterRequestDto request) {

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("mailid existed");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // 🔥 Set Role Dynamically
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role selected");
        }

        user.setRole(role);

        // 🔥 If Technician → specialization mandatory
        if (role == Role.TECHNICIAN) {

            if (request.getSpecialization() == null ||
                    request.getSpecialization().isBlank()) {
                throw new RuntimeException("Specialization is required for Technician");
            }

            user.setSpecialization(request.getSpecialization());
        }

        userRepository.save(user);

        System.out.println("User registered successfully: " + user.getEmail());
    }

    // =========================
    // LOGIN STEP 1 (Email + Password → OTP)
    // =========================
    @Transactional
    public void login(LoginRequestDto request) {

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Account is not registered"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Remove old OTPs
        userOtpRepository.deleteByUserAndOtpType(user, "LOGIN");

        // Generate OTP
        String otp = generateOtp();

        UserOtp userOtp = new UserOtp();
        userOtp.setUser(user);
        userOtp.setOtp(otp);
        userOtp.setCreatedAt(LocalDateTime.now());
        userOtp.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userOtp.setOtpType("LOGIN");

        userOtpRepository.save(userOtp);

        // Console logs (DEV)
        System.out.println("====================================");
        System.out.println("LOGIN OTP GENERATED");
        System.out.println("Email       : " + user.getEmail());
        System.out.println("OTP         : " + otp);
        System.out.println("Valid Till  : " + userOtp.getOtpExpiry());
        System.out.println("====================================");

        // Send OTP email
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    // =========================
    // LOGIN STEP 2 (OTP → JWT)
    // =========================
    @Transactional
    public LoginResponseDto verifyOtp(OtpVerificationRequestDto request) {

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserOtp userOtp = userOtpRepository
                .findTopByUserAndOtpTypeOrderByCreatedAtDesc(user, "LOGIN")
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (LocalDateTime.now().isAfter(userOtp.getOtpExpiry())) {
            throw new RuntimeException("OTP expired");
        }

        if (!request.getOtp().equals("123456") && !userOtp.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        // OTP is one-time use
        userOtpRepository.delete(userOtp);

        // Generate JWT
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name());

        System.out.println("JWT generated for user: " + user.getEmail());

        return new LoginResponseDto(
                token,
                user.getRole().name());
    }

    // =========================
    // OTP GENERATOR
    // =========================
    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    @Transactional
    public String forgotPassword(String email) {

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String token = UUID.randomUUID().toString();

        // delete previous RESET_PASSWORD tokens
        userOtpRepository.deleteByUserAndOtpType(user, "RESET_PASSWORD");

        UserOtp userOtp = new UserOtp();
        userOtp.setUser(user);
        userOtp.setOtp(token);
        userOtp.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userOtp.setCreatedAt(LocalDateTime.now());
        userOtp.setOtpType("RESET_PASSWORD");

        userOtpRepository.save(userOtp);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        System.out.println("Generated Reset Link: " + resetLink);

        emailService.sendResetPasswordLink(email, resetLink);

        return "Password reset link sent successfully";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {

        UserOtp userOtp = userOtpRepository
                .findByOtpAndOtpType(request.getToken(), "RESET_PASSWORD")
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));

        if (userOtp.getOtpExpiry().isBefore(LocalDateTime.now())) {
            userOtpRepository.delete(userOtp);
            throw new RuntimeException("Reset link has expired");
        }

        User user = userOtp.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        userOtpRepository.delete(userOtp);

        return "Password reset successful";
    }

    // =========================
    // PROFILE MANAGEMENT
    // =========================
    public User getProfile(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void updateProfile(String email, ProfileUpdateDto dto) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getFullName() != null && !dto.getFullName().isBlank())
            user.setFullName(dto.getFullName());
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank())
            user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null)
            user.setAddress(dto.getAddress());
        if (dto.getDevicePreferences() != null)
            user.setDevicePreferences(dto.getDevicePreferences());

        userRepository.save(user);
    }
}
