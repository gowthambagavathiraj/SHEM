package com.info.shems.dto;

public class TelemetryDto {
    private String deviceKey;
    private Double currentPower;
    private String status; // "ON" or "OFF"

    public String getDeviceKey() {
        return deviceKey;
    }

    public void setDeviceKey(String deviceKey) {
        this.deviceKey = deviceKey;
    }

    public Double getCurrentPower() {
        return currentPower;
    }

    public void setCurrentPower(Double currentPower) {
        this.currentPower = currentPower;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
