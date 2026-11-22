package com.it4409.multicam.controller;

import com.it4409.multicam.dto.ApiResponse;
import com.it4409.multicam.dto.CreateRoomRequest;
import com.it4409.multicam.dto.JoinRoomRequest;
import com.it4409.multicam.dto.JoinRoomResponse;
import com.it4409.multicam.dto.RoomResponse;
import com.it4409.multicam.service.RoomService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rooms")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) CreateRoomRequest request) {
        return ResponseEntity.ok(ApiResponse.success(roomService.createRoom(jwt.getSubject(), request)));
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('REMOTE')")
    public ResponseEntity<ApiResponse<JoinRoomResponse>> joinRoom(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody JoinRoomRequest request) {
        return ResponseEntity.ok(ApiResponse.success(roomService.joinRoom(jwt.getSubject(), request)));
    }

    @GetMapping("/{room_id}/members")
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<List<RoomResponse.MemberSummary>>> getMembers(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("room_id") String roomId) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getMembers(jwt.getSubject(), roomId)));
    }
}
