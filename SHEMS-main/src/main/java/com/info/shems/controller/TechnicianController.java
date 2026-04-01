package com.info.shems.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/technician")
public class TechnicianController {

    @GetMapping("/dashboard")
    public ResponseEntity<String> getTechnicianDashboard() {
        return ResponseEntity.ok("Welcome to the Technician Dashboard!");
    }
}
