package com.info.shems.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class OtpVerificationRequestDto {

    @Email(message = "Enter a valid email")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;

    // Getters and Setters
    public String getEmail() {
        return email;
    }
 
    public void setEmail(String email) {
        this.email = email;
    }
 
    public String getOtp() {
        return otp;
    }
 
    public void setOtp(String otp) {
        this.otp = otp;
    }
}
