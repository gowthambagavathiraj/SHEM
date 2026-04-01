package com.info.shems.service;

import com.info.shems.model.Device;
import com.info.shems.model.Recommendation;
import com.info.shems.model.User;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.RecommendationRepository;
import com.info.shems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {

    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DeviceRepository deviceRepository;

    // ── Get recommendations for logged-in user ──────────────────────────────────
    public List<Recommendation> getRecommendations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Recommendation> existing = recommendationRepository.findByUserOrderByCreatedAtDesc(user);

        // Generate fresh insights if none exist or all are older than 24 hours
        boolean allStale = existing.isEmpty() || existing.stream()
                .allMatch(r -> r.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24)));

        if (allStale) {
            generateInsights(user);
            existing = recommendationRepository.findByUserOrderByCreatedAtDesc(user);
        }

        return existing;
    }

    // ── Manual refresh endpoint trigger ─────────────────────────────────────────
    @Transactional
    public void refreshForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        generateInsights(user);
    }

    // ── Daily auto-generation at 7 AM for all users ──────────────────────────────
    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void dailyInsightGeneration() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            generateInsights(user);
        }
        System.out.println("✅ Daily insights generated for " + users.size() + " users.");
    }

    // ── Smart Insight Engine: device-aware personalized tips ─────────────────────
    @Transactional
    private void generateInsights(User user) {
        // Clear old recommendations for this user
        List<Recommendation> old = recommendationRepository.findByUserOrderByCreatedAtDesc(user);
        if (!old.isEmpty()) recommendationRepository.deleteAll(old);

        List<Device> devices = deviceRepository.findByUser(user);
        List<String> insights = new ArrayList<>();

        double totalPowerW = devices.stream()
                .filter(d -> "ON".equalsIgnoreCase(d.getStatus()))
                .mapToDouble(d -> d.getCurrentPower() != null ? d.getCurrentPower() : d.getPowerRating() * 0.8)
                .sum();
        long onCount = devices.stream().filter(d -> "ON".equalsIgnoreCase(d.getStatus())).count();

        boolean hasAC = devices.stream().anyMatch(d -> d.getType().name().equals("AC"));
        boolean hasEV = devices.stream().anyMatch(d -> d.getType().name().equals("EV_CHARGER"));
        boolean hasWasher = devices.stream().anyMatch(d -> d.getType().name().equals("WASHING_MACHINE"));
        boolean hasHeater = devices.stream().anyMatch(d -> d.getType().name().equals("WATER_HEATER"));
        boolean hasLight = devices.stream().anyMatch(d -> d.getType().name().equals("LIGHT"));
        boolean hasRefrigerator = devices.stream().anyMatch(d -> d.getType().name().equals("REFRIGERATOR"));

        // Device-specific smart insights
        if (hasAC) {
            insights.add("💡 Your AC uses ~40% less energy in 'fan-only' mode. Switch to fan mode after 9 PM to save ~₹120/month.");
        }
        if (hasEV) {
            insights.add("⚡ Charge your EV between 12 AM–5 AM during off-peak hours to cut charging costs by up to 30%.");
        }
        if (hasWasher) {
            insights.add("🌀 Run your washing machine after 10 PM to take advantage of off-peak electricity rates. Save ₹80–₹120/month.");
        }
        if (hasHeater) {
            insights.add("🚿 Set your water heater timer to heat water 30 min before use instead of keeping it ON all day. Save ₹200/month.");
        }
        if (hasLight) {
            insights.add("💡 Switching all remaining incandescent bulbs to LEDs cuts lighting energy consumption by up to 80%.");
        }
        if (hasRefrigerator) {
            insights.add("🧊 Keep your refrigerator at 3-4°C and freezer at -15°C — optimal settings that reduce compressor cycles by 25%.");
        }

        // Usage-pattern insights
        if (totalPowerW > 2500) {
            insights.add(String.format("⚠️ Your home is consuming %.1f W right now — above the 2.5 kW recommended limit. Turn off idle devices to avoid overload charges.", totalPowerW));
        }
        if (onCount >= 3) {
            insights.add("🔌 Multiple devices are active simultaneously. Use the Automation Scheduler to stagger usage and reduce peak-hour load.");
        }
        if (onCount == 0 && !devices.isEmpty()) {
            insights.add("✅ All devices are currently OFF — great energy discipline! Remember to use the scheduler to automate off-peak usage.");
        }
        if (devices.isEmpty()) {
            insights.add("📱 Add your household devices to get personalized energy-saving recommendations based on your usage.");
        }

        // Universal best practices (always shown)
        insights.add("📅 Use the Automation Scheduler to set ON/OFF times for high-power devices — it's the single most effective way to reduce your electricity bill.");
        insights.add("🌍 Every 1 kWh saved = 0.85 kg of CO₂ avoided. Your energy habits matter for the planet!");

        // Save all insights
        for (String msg : insights) {
            recommendationRepository.save(new Recommendation(user, msg));
        }
    }
}
