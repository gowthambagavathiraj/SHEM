package com.info.shems.controller;

import com.info.shems.model.Recommendation;
import com.info.shems.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<Recommendation>> getRecommendations(Authentication authentication) {
        return ResponseEntity.ok(recommendationService.getRecommendations(authentication.getName()));
    }

    // Manual refresh — re-generate insights on demand
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(Authentication authentication) {
        recommendationService.refreshForUser(authentication.getName());
        return ResponseEntity.ok(Map.of("status", "Insights refreshed successfully"));
    }
}
