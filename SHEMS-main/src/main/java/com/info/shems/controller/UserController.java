package com.info.shems.controller;

import com.info.shems.dto.ProfileUpdateDto;
import com.info.shems.model.User;
import com.info.shems.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private AuthService authService;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.getProfile(email));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(Authentication authentication, @RequestBody ProfileUpdateDto dto) {
        String email = authentication.getName();
        authService.updateProfile(email, dto);
        return ResponseEntity.ok("Profile updated successfully");
    }
}
