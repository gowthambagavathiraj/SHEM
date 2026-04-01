package com.info.shems.service;

import com.info.shems.model.Device;
import com.info.shems.model.EnergyUsage;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.EnergyUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnergyUsageService {

    @Autowired
    private EnergyUsageRepository energyUsageRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private com.info.shems.repository.SystemPolicyRepository policyRepository;

    /**
     * Periodically logs energy usage for all active (ON) devices.
     * In a real scenario, this would compute Wh based on duration.
     * Here, we'll simulate hourly usage as: (currentPower * 1 hour).
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour on the hour
    @Transactional
    public void logHourlyUsage() {
        List<Device> activeDevices = deviceRepository.findAll().stream()
                .filter(d -> "ON".equals(d.getStatus()))
                .toList();

        // Get max energy threshold policy (default to 5000W if not set)
        Double threshold = policyRepository.findByPolicyKey("MAX_ENERGY_THRESHOLD")
                .map(com.info.shems.model.SystemPolicy::getValue)
                .orElse(5000.0);

        // Get energy rate policy (default to ₹7/kWh if not set)
        Double rate = policyRepository.findByPolicyKey("ENERGY_RATE")
                .map(com.info.shems.model.SystemPolicy::getValue)
                .orElse(7.0);

        LocalDateTime now = LocalDateTime.now();
        for (Device device : activeDevices) {
            // Check if current power exceeds threshold (Policy enforcement)
            if (device.getCurrentPower() > threshold) {
                System.out.println("⚠️ POLICY ALERT: Device [" + device.getName() + 
                                   "] is exceeding threshold! Current: " + device.getCurrentPower() + 
                                   "W, Threshold: " + threshold + "W");
            }

            // Consumption in Wh = Current Watts * 1 hour
            Double consumption = device.getCurrentPower(); 
            // Cost = (Wh / 1000) * Rate
            Double cost = (consumption / 1000.0) * rate;

            EnergyUsage usage = new EnergyUsage(device, device.getUser(), consumption, cost, now);
            energyUsageRepository.save(usage);
        }
        System.out.println("Hourly energy usage logged for " + activeDevices.size() + " devices.");
    }

    /**
     * Manual log for testing purposes.
     */
    @Transactional
    public void logCurrentUsageManual() {
        logHourlyUsage();
    }
}
