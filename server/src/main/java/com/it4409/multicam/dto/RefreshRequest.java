package com.it4409.multicam.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(@NotBlank(message = "refresh_token không được để trống.") String refreshToken) {
}
