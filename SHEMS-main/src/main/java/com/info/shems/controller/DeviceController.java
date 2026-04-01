package com.info.shems.controller;

import com.info.shems.dto.AddDeviceDto;
import com.info.shems.dto.DeviceResponseDto;
import com.info.shems.dto.TelemetryDto;
import com.info.shems.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    // ─── List all devices for the logged-in homeowner ─────────────────────────
    @GetMapping
    public ResponseEntity<List<DeviceResponseDto>> getDevices(Authentication auth) {
        return ResponseEntity.ok(deviceService.getUserDevices(auth.getName()));
    }

    // ─── Add a new device ──────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<DeviceResponseDto> addDevice(Authentication auth,
            @RequestBody AddDeviceDto dto) {
        return ResponseEntity.ok(deviceService.addDevice(auth.getName(), dto));
    }

    // ─── Edit an existing device ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<DeviceResponseDto> updateDevice(Authentication auth,
            @PathVariable Long id,
            @RequestBody AddDeviceDto dto) {
        return ResponseEntity.ok(deviceService.updateDevice(id, auth.getName(), dto));
    }

    // ─── Toggle device on/off ─────────────────────────────────────────────────
    @PutMapping("/{id}/toggle")
    public ResponseEntity<DeviceResponseDto> toggle(Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(deviceService.toggleDevice(id, auth.getName()));
    }

    // ─── Update wattage (software simulator) ──────────────────────────────────
    @PutMapping("/{id}/power")
    public ResponseEntity<DeviceResponseDto> updatePower(Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        Double watts = body.getOrDefault("watts", 0.0);
        return ResponseEntity.ok(deviceService.updatePower(id, auth.getName(), watts));
    }

    // ─── Delete device ─────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDevice(Authentication auth,
            @PathVariable Long id) {
        deviceService.deleteDevice(id, auth.getName());
        return ResponseEntity.ok("Device deleted");
    }

    // ─── Telemetry endpoint (public – called by edge devices using deviceKey) ─
    @PostMapping("/telemetry")
    public ResponseEntity<String> telemetry(@RequestBody TelemetryDto dto) {
        deviceService.processTelemetry(dto);
        return ResponseEntity.ok("Telemetry received");
    }
}
