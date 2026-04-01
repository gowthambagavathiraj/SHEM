package com.info.shems.controller;

import com.info.shems.model.SystemPolicy;
import com.info.shems.repository.SystemPolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private SystemPolicyRepository policyRepository;

    @GetMapping("/policies")
    public List<SystemPolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    @PostMapping("/policies")
    public ResponseEntity<SystemPolicy> updatePolicy(@RequestBody SystemPolicy policy) {
        SystemPolicy existing = policyRepository.findByPolicyKey(policy.getPolicyKey())
                .orElse(new SystemPolicy());
        
        existing.setPolicyKey(policy.getPolicyKey());
        existing.setValue(policy.getValue());
        existing.setDescription(policy.getDescription());
        
        return ResponseEntity.ok(policyRepository.save(existing));
    }
}
