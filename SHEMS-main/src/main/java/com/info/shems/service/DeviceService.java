package com.info.shems.service;

import com.info.shems.dto.AddDeviceDto;
import com.info.shems.dto.DeviceResponseDto;
import com.info.shems.dto.TelemetryDto;
import com.info.shems.model.Device;
import com.info.shems.model.DeviceType;
import com.info.shems.model.User;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    // ─── Add a new device for the logged-in homeowner ─────────────────────────
    @Transactional
    public DeviceResponseDto addDevice(String email, AddDeviceDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = new Device();
        device.setName(dto.getName());
        device.setType(DeviceType.valueOf(dto.getType().toUpperCase()));
        device.setPowerRating(dto.getPowerRating() != null ? dto.getPowerRating() : 0.0);
        device.setDeviceKey(UUID.randomUUID().toString());
        device.setStatus("OFF");
        device.setCurrentPower(0.0);
        device.setUser(user);

        device = deviceRepository.save(device);
        return toDto(device);
    }

    // ─── Get all devices for a homeowner ──────────────────────────────────────
    public List<DeviceResponseDto> getUserDevices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return deviceRepository.findByUser(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── Edit an existing device ───────────────────────────────────────────────
    @Transactional
    public DeviceResponseDto updateDevice(Long deviceId, String email, AddDeviceDto dto) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }

        device.setName(dto.getName());
        device.setType(DeviceType.valueOf(dto.getType().toUpperCase()));
        device.setPowerRating(dto.getPowerRating() != null ? dto.getPowerRating() : 0.0);
        
        // Ensure current power is clamped if max rating lowers
        if (device.getCurrentPower() > device.getPowerRating()) {
            device.setCurrentPower(device.getPowerRating());
        }
        
        device = deviceRepository.save(device);
        return toDto(device);
    }

    // ─── Toggle device ON/OFF ──────────────────────────────────────────────────
    @Transactional
    public DeviceResponseDto toggleDevice(Long deviceId, String email) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Ensure the device belongs to the requesting user
        if (!device.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }

        String newStatus = device.getStatus().equals("ON") ? "OFF" : "ON";
        device.setStatus(newStatus);

        // If turned off, reset current power to 0
        if (newStatus.equals("OFF")) {
            device.setCurrentPower(0.0);
        } else {
            // Simulate default power as 80% of rated power when turned on
            device.setCurrentPower(device.getPowerRating() * 0.8);
        }

        device = deviceRepository.save(device);
        return toDto(device);
    }

    // ─── Delete device ─────────────────────────────────────────────────────────
    @Transactional
    public void deleteDevice(Long deviceId, String email) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }
        deviceRepository.delete(device);
    }

    // ─── Receive telemetry from an edge device (by deviceKey) ─────────────────
    @Transactional
    public void processTelemetry(TelemetryDto dto) {
        Device device = deviceRepository.findByDeviceKey(dto.getDeviceKey())
                .orElseThrow(() -> new RuntimeException("Unknown device key"));

        if (dto.getCurrentPower() != null) {
            device.setCurrentPower(dto.getCurrentPower());
        }
        if (dto.getStatus() != null) {
            device.setStatus(dto.getStatus().toUpperCase());
        }
        deviceRepository.save(device);
    }

    // ─── Simulate wattage from the UI (update currentPower directly) ──────────
    @Transactional
    public DeviceResponseDto updatePower(Long deviceId, String email, Double watts) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }

        device.setCurrentPower(watts);
        device = deviceRepository.save(device);
        return toDto(device);
    }

    // ─── Convert entity to DTO ─────────────────────────────────────────────────
    private DeviceResponseDto toDto(Device device) {
        return new DeviceResponseDto(
                device.getId(),
                device.getName(),
                device.getType().name(),
                device.getStatus(),
                device.getPowerRating(),
                device.getCurrentPower(),
                device.getDeviceKey());
    }
}
