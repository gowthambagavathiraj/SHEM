package com.info.shems.dto;

import java.time.LocalTime;

public class DeviceScheduleDto {
    private Long id;
    private Long deviceId;
    private String deviceName;
    private LocalTime startTime;
    private LocalTime endTime;
    private String action;
    private boolean active;

    public DeviceScheduleDto(Long id, Long deviceId, String deviceName, LocalTime startTime, LocalTime endTime, String action, boolean active) {
        this.id = id;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.action = action;
        this.active = active;
    }

    // ===== Getters and Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDeviceId() { return deviceId; }
    public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
