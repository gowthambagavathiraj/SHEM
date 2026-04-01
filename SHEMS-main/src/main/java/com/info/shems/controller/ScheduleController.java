package com.info.shems.controller;

import com.info.shems.dto.DeviceScheduleDto;
import com.info.shems.model.Device;
import com.info.shems.model.DeviceSchedule;
import com.info.shems.model.User;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.DeviceScheduleRepository;
import com.info.shems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private DeviceScheduleRepository scheduleRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<DeviceScheduleDto> getSchedules(Authentication authentication) {
        return scheduleRepository.findByUserEmail(authentication.getName()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<DeviceScheduleDto> createSchedule(
            Authentication authentication,
            @RequestBody DeviceScheduleDto dto) {
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Device device = deviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
             throw new RuntimeException("Access denied");
        }

        DeviceSchedule schedule = new DeviceSchedule();
        schedule.setDevice(device);
        schedule.setUser(user);
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setAction(dto.getAction());
        schedule.setActive(true);

        schedule = scheduleRepository.save(schedule);
        return ResponseEntity.ok(toDto(schedule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(Authentication authentication, @PathVariable Long id) {
        DeviceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        
        if (!schedule.getUser().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Access denied");
        }
        
        scheduleRepository.delete(schedule);
        return ResponseEntity.noContent().build();
    }

    private DeviceScheduleDto toDto(DeviceSchedule s) {
        return new DeviceScheduleDto(s.getId(), s.getDevice().getId(), s.getDevice().getName(), 
        s.getStartTime(), s.getEndTime(), s.getAction(), s.isActive());
    }
}
