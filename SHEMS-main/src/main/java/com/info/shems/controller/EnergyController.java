package com.info.shems.controller;

import com.info.shems.dto.EnergyUsageHistoryDto;
import com.info.shems.model.EnergyUsage;
import com.info.shems.model.User;
import com.info.shems.repository.EnergyUsageRepository;
import com.info.shems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/energy")
public class EnergyController {

    @Autowired
    private EnergyUsageRepository energyUsageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/history")
    public ResponseEntity<List<EnergyUsageHistoryDto>> getEnergyHistory(
            Authentication authentication,
            @RequestParam(required = false) String range) {
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Default range: last 24 hours
        LocalDateTime start = LocalDateTime.now().minusHours(24);
        LocalDateTime end = LocalDateTime.now();

        if ("week".equalsIgnoreCase(range)) {
            start = LocalDateTime.now().minusWeeks(1);
        } else if ("month".equalsIgnoreCase(range)) {
            start = LocalDateTime.now().minusMonths(1);
        }

        List<EnergyUsage> history = energyUsageRepository.findByUserAndTimestampBetween(user, start, end);
        
        List<EnergyUsageHistoryDto> dtos = history.stream()
                .map(h -> new EnergyUsageHistoryDto(h.getDevice().getName(), h.getConsumption(), h.getCost(), h.getTimestamp()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ── This Week vs Last Week Comparison ──────────────────────────────────────
    @GetMapping("/comparison")
    public ResponseEntity<Map<String, Object>> getComparison(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thisWeekStart = now.minusDays(7);
        LocalDateTime lastWeekStart = now.minusDays(14);

        List<EnergyUsage> thisWeek = energyUsageRepository.findByUserAndTimestampBetween(user, thisWeekStart, now);
        List<EnergyUsage> lastWeek = energyUsageRepository.findByUserAndTimestampBetween(user, lastWeekStart, thisWeekStart);

        Map<String, Double> thisWeekByDay = groupByDay(thisWeek);
        Map<String, Double> lastWeekByDay = groupByDay(lastWeek);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("thisWeek", thisWeekByDay);
        result.put("lastWeek", lastWeekByDay);
        return ResponseEntity.ok(result);
    }

    private Map<String, Double> groupByDay(List<EnergyUsage> usages) {
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        Map<String, Double> map = new LinkedHashMap<>();
        for (String d : days) map.put(d, 0.0);
        for (EnergyUsage u : usages) {
            String day = u.getTimestamp().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            map.merge(day, u.getConsumption() / 1000.0, Double::sum); // convert Wh -> kWh
        }
        return map;
    }

    // ── Summary Stats ──────────────────────────────────────────────────────────
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "24h") String range) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime start = LocalDateTime.now().minusHours(24);
        if ("week".equalsIgnoreCase(range)) start = LocalDateTime.now().minusWeeks(1);
        else if ("month".equalsIgnoreCase(range)) start = LocalDateTime.now().minusMonths(1);

        List<EnergyUsage> logs = energyUsageRepository.findByUserAndTimestampBetween(user, start, LocalDateTime.now());

        double totalWh = logs.stream().mapToDouble(EnergyUsage::getConsumption).sum();
        double totalKwh = totalWh / 1000.0;
        double totalCost = logs.stream().mapToDouble(u -> u.getCost() != null ? u.getCost() : 0.0).sum();

        // Peak hour: hour of day with highest total usage
        Map<Integer, Double> byHour = new HashMap<>();
        for (EnergyUsage u : logs) {
            int hour = u.getTimestamp().getHour();
            byHour.merge(hour, u.getConsumption(), Double::sum);
        }
        int peakHour = byHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse(18);

        long days = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(start, LocalDateTime.now()));
        double dailyAvg = totalKwh / days;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalKwh", Math.round(totalKwh * 100.0) / 100.0);
        result.put("estimatedCost", Math.round(totalCost * 100.0) / 100.0);
        result.put("peakHour", peakHour);
        result.put("dailyAvg", Math.round(dailyAvg * 100.0) / 100.0);
        return ResponseEntity.ok(result);
    }

    @Autowired
    private com.info.shems.service.ReportService reportService;

    @Autowired
    private com.info.shems.service.EnergyUsageService energyUsageService;

    @GetMapping("/report")
    public ResponseEntity<byte[]> downloadReport(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        byte[] pdf = reportService.generateEnergyReport(user);
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=energy_report.pdf")
                .body(pdf);
    }

    @PostMapping("/log-now")
    public ResponseEntity<Map<String, String>> logNow() {
        energyUsageService.logCurrentUsageManual();
        return ResponseEntity.ok(Map.of("status", "Energy usage logged manually"));
    }
}
