package com.info.shems.dto;

import lombok.Data;

@Data
public class ProfileUpdateDto {
    private String fullName;
    private String phoneNumber;
    private String address;
    private String devicePreferences;

    // Getters and Setters (if Lombok @Data doesn't work in this env, adding
    // manually for safety)
    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDevicePreferences() {
        return devicePreferences;
    }

    public void setDevicePreferences(String devicePreferences) {
        this.devicePreferences = devicePreferences;
    }
}
