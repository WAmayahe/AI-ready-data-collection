package com.it4409.multicam.dto;

import java.util.List;

public record JoinRoomResponse(
        String roomId,
        String roomName,
        String memberId,
        List<RoomResponse.MemberSummary> members) {
}
