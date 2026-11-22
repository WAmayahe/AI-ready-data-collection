package com.it4409.multicam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record JoinRoomRequest(
        @NotBlank(message = "invite_code không được để trống.") String inviteCode,
        @NotBlank(message = "device_id không được để trống.") String deviceId,
        @NotBlank(message = "camera_name không được để trống.") String cameraName,
        @NotNull(message = "grant_control không được để trống.") Boolean grantControl) {
}
