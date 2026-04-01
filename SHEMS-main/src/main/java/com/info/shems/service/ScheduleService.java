package com.info.shems.service;

import com.info.shems.model.Device;
import com.info.shems.model.DeviceSchedule;
import com.info.shems.model.User;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.DeviceScheduleRepository;
import com.info.shems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ScheduleService {

    @Autowired private DeviceScheduleRepository scheduleRepository;
    @Autowired private DeviceService deviceService;
    @Autowired private DeviceRepository deviceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailService emailService;

    // Tracks the last time an overload alert was sent per user (email → timestamp)
    private final Map<String, LocalDateTime> lastAlertSent = new ConcurrentHashMap<>();

    // ── Schedule Executor: runs every minute ────────────────────────────────────
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void processSchedules() {
        LocalTime now = LocalTime.now().truncatedTo(ChronoUnit.MINUTES);
        List<DeviceSchedule> activeSchedules = scheduleRepository.findByActive(true);

        for (DeviceSchedule schedule : activeSchedules) {
            Device device = schedule.getDevice();

            // Turn ON at startTime
            if (schedule.getStartTime().equals(now) && !device.getStatus().equals("ON")) {
                deviceService.toggleDevice(device.getId(), device.getUser().getEmail());
                System.out.println("✅ Schedule: " + device.getName() + " turned ON at " + now);

                // Send confirmation email
                try {
                    emailService.sendScheduleConfirmation(
                        device.getUser().getEmail(),
                        device.getName(),
                        schedule.getStartTime().toString(),
                        schedule.getEndTime().toString()
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Could not send schedule email: " + e.getMessage());
                }
            }

            // Turn OFF at endTime
            if (schedule.getEndTime().equals(now) && device.getStatus().equals("ON")) {
                deviceService.toggleDevice(device.getId(), device.getUser().getEmail());
                System.out.println("✅ Schedule: " + device.getName() + " turned OFF at " + now);
                
                // Send completion email
                try {
                    emailService.sendScheduleCompletion(
                        device.getUser().getEmail(),
                        device.getName(),
                        schedule.getEndTime().toString()
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Could not send schedule completion email: " + e.getMessage());
                }
            }
        }
    }

    // ── Energy Overload Monitor: runs every 5 minutes ──────────────────────────
    @Scheduled(cron = "0 */5 * * * *")
    public void checkEnergyOverload() {
        final double OVERLOAD_LIMIT_WATTS = 3000.0; // 3kW threshold

        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            List<Device> onDevices = deviceRepository.findByUser(user)
                .stream()
                .filter(d -> "ON".equalsIgnoreCase(d.getStatus()))
                .toList();

            double totalWatts = onDevices.stream()
                .mapToDouble(d -> d.getCurrentPower() != null ? d.getCurrentPower() : 0.0)
                .sum();

            if (totalWatts > OVERLOAD_LIMIT_WATTS) {
                // Discover which devices are causing the spike
                String culprits = onDevices.stream()
                    .filter(d -> (d.getCurrentPower() != null && d.getCurrentPower() > 1000) || (d.getPowerRating() != null && d.getPowerRating() > 1000))
                    .map(Device::getName)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("Multiple active appliances");

                // Rate-limit: only send one alert per user per hour
                LocalDateTime lastAlert = lastAlertSent.get(user.getEmail());
                if (lastAlert == null || lastAlert.isBefore(LocalDateTime.now().minusHours(1))) {
                    lastAlertSent.put(user.getEmail(), LocalDateTime.now());
                    try {
                        emailService.sendOverloadAlert(
                            user.getEmail(),
                            user.getFullName(),
                            totalWatts,
                            OVERLOAD_LIMIT_WATTS,
                            culprits
                        );
                    } catch (Exception e) {
                        System.err.println("⚠️ Could not send overload alert: " + e.getMessage());
                    }
                }
            }
        }
    }
}
