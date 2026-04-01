package com.info.shems.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/homeowner")
@PreAuthorize("hasRole('HOMEOWNER')")
public class HomeownerController {

    @GetMapping("/dashboard")
    public ResponseEntity<String> getHomeownerDashboard() {
        return ResponseEntity.ok("Welcome to the Homeowner Dashboard!");
    }
}
