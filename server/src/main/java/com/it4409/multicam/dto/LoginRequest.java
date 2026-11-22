package com.it4409.multicam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        String email,
        String phone,
        @NotBlank(message = "Mật khẩu không được để trống.") String password,
        @NotBlank(message = "device_id không được để trống.") String deviceId,
        @NotNull(message = "device_type không được để trống.") Integer deviceType,
        @NotBlank(message = "device_name không được để trống.") String deviceName) {
}
