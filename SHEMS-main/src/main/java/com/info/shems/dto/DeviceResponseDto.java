package com.info.shems.dto;

public class DeviceResponseDto {
    private Long id;
    private String name;
    private String type;
    private String status;
    private Double powerRating;
    private Double currentPower;
    private String deviceKey;

    public DeviceResponseDto() {
    }

    public DeviceResponseDto(Long id, String name, String type, String status,
            Double powerRating, Double currentPower, String deviceKey) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.powerRating = powerRating;
        this.currentPower = currentPower;
        this.deviceKey = deviceKey;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getPowerRating() {
        return powerRating;
    }

    public void setPowerRating(Double powerRating) {
        this.powerRating = powerRating;
    }

    public Double getCurrentPower() {
        return currentPower;
    }

    public void setCurrentPower(Double currentPower) {
        this.currentPower = currentPower;
    }

    public String getDeviceKey() {
        return deviceKey;
    }

    public void setDeviceKey(String deviceKey) {
        this.deviceKey = deviceKey;
    }
}
