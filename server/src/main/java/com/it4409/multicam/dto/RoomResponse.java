package com.it4409.multicam.dto;

import java.time.Instant;
import java.util.List;

public record RoomResponse(
        String roomId,
        String inviteCode,
        Instant expiresAt,
        Instant createdAt,
        List<MemberSummary> members) {
    public record MemberSummary(String memberId, String cameraName, String isOnline) {
    }
}
