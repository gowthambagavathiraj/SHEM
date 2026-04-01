package com.info.shems.dto;

public class LoginResponseDto {

    private String token;
    private String role;

    public LoginResponseDto(String token, String role) {
        this.token = token;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }
}
