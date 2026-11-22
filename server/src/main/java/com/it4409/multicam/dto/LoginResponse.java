package com.it4409.multicam.dto;

public record LoginResponse(
        UserSummary user,
        String accountRole,
        String accessToken,
        String refreshToken,
        long expiresIn,
        DeviceSummary device) {
    public record UserSummary(
            String id,
            String firstName,
            String lastName,
            String email,
            String phone) {
    }

    public record DeviceSummary(String deviceId, String cameraName) {
    }
}
