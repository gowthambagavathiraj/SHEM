package com.info.shems.dto;

import java.time.LocalDateTime;

public class EnergyUsageHistoryDto {
    private String deviceName;
    private Double consumption;
    private Double cost;
    private LocalDateTime timestamp;

    public EnergyUsageHistoryDto(String deviceName, Double consumption, Double cost, LocalDateTime timestamp) {
        this.deviceName = deviceName;
        this.consumption = consumption;
        this.cost = cost;
        this.timestamp = timestamp;
    }

    // ===== Getters and Setters =====
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public Double getConsumption() { return consumption; }
    public void setConsumption(Double consumption) { this.consumption = consumption; }

    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
