package com.it4409.multicam.service;

import com.it4409.multicam.dto.CreateRoomRequest;
import com.it4409.multicam.dto.JoinRoomRequest;
import com.it4409.multicam.dto.JoinRoomResponse;
import com.it4409.multicam.dto.RoomResponse;
import com.it4409.multicam.entity.DeviceRecord;
import com.it4409.multicam.entity.Room;
import com.it4409.multicam.entity.RoomMember;
import com.it4409.multicam.exception.ApiException;
import com.it4409.multicam.repository.DeviceRecordRepository;
import com.it4409.multicam.repository.RoomMemberRepository;
import com.it4409.multicam.repository.RoomRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RoomService {
    private static final String INVITE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final DeviceRecordRepository deviceRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomService(
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            DeviceRecordRepository deviceRepository) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.deviceRepository = deviceRepository;
    }

    @Transactional
    public RoomResponse createRoom(String ownerId, CreateRoomRequest request) {
        Instant now = Instant.now();
        return roomRepository.findFirstByOwnerIdAndClosedFalseAndExpiresAtAfterOrderByCreatedAtDesc(ownerId, now)
                .map(this::toRoomResponse)
                .orElseGet(() -> createNewRoom(ownerId, request, now));
    }

    @Transactional(readOnly = true)
    public List<RoomResponse.MemberSummary> getMembers(String ownerId, String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("2005", "Không tìm thấy phòng.", HttpStatus.NOT_FOUND));
        if (!room.getOwnerId().equals(ownerId)) {
            throw new ApiException("2004", "Chỉ chủ phòng mới được xem danh sách thành viên.", HttpStatus.FORBIDDEN);
        }
        return memberRepository.findByRoomIdOrderByJoinedAtAsc(roomId).stream()
                .map(this::toMemberSummary)
                .toList();
    }

    @Transactional
    public JoinRoomResponse joinRoom(String userId, JoinRoomRequest request) {
        String inviteCode = request.inviteCode().trim().toUpperCase();
        if (!inviteCode.matches("[A-Z0-9]{6}") || !Boolean.TRUE.equals(request.grantControl())) {
            throw new ApiException("1003", "Mã mời phải có 6 ký tự và cần chấp thuận quyền điều khiển.", HttpStatus.BAD_REQUEST);
        }

        Room room = roomRepository.findByInviteCodeIgnoreCase(inviteCode)
                .orElseThrow(() -> new ApiException("2006", "Mã phòng không tồn tại.", HttpStatus.NOT_FOUND));
        Instant now = Instant.now();
        if (room.isClosed() || !room.getExpiresAt().isAfter(now)) {
            throw new ApiException("2001", "Mã phòng đã hết hạn hoặc đã đóng.", HttpStatus.GONE);
        }

        DeviceRecord device = deviceRepository.findByIdAndUserId(request.deviceId(), userId)
                .orElseThrow(() -> new ApiException("1009", "Thiết bị chưa được đăng ký bằng tài khoản này.", HttpStatus.FORBIDDEN));
        RoomMember existingInRoom = memberRepository.findFirstByRoomIdAndUserId(room.getId(), userId).orElse(null);
        if (existingInRoom != null) {
            return toJoinResponse(room, existingInRoom);
        }

        RoomMember existingMembership = memberRepository.findFirstByUserId(userId).orElse(null);
        if (existingMembership != null) {
            Room previousRoom = roomRepository.findById(existingMembership.getRoomId()).orElse(null);
            if (previousRoom != null && !previousRoom.isClosed() && previousRoom.getExpiresAt().isAfter(now)) {
                throw new ApiException("2003", "Thiết bị đang ở trong một phòng khác.", HttpStatus.CONFLICT);
            }
        }

        if (memberRepository.countByRoomId(room.getId()) >= room.getMaxMembers()) {
            throw new ApiException("2002", "Phòng đã đầy.", HttpStatus.CONFLICT);
        }

        String cameraName = request.cameraName().trim();
        if (!StringUtils.hasText(cameraName) || cameraName.length() > 64) {
            throw new ApiException("1003", "camera_name phải có từ 1 đến 64 ký tự.", HttpStatus.BAD_REQUEST);
        }
        RoomMember member = memberRepository.save(new RoomMember(
                newId("mb_"),
                room.getId(),
                userId,
                device.getId(),
                cameraName,
                true,
                now));
        return toJoinResponse(room, member);
    }

    private RoomResponse createNewRoom(String ownerId, CreateRoomRequest request, Instant now) {
        String requestedName = request == null ? null : request.roomName();
        Integer requestedLimit = request == null ? null : request.maxMembers();
        int maxMembers = requestedLimit == null ? 8 : requestedLimit;
        if (maxMembers < 1 || maxMembers > 32) {
            throw new ApiException("1003", "max_members phải nằm trong khoảng 1 đến 32.", HttpStatus.BAD_REQUEST);
        }
        String roomName = StringUtils.hasText(requestedName) ? requestedName.trim() : "Phòng ghi hình";
        if (roomName.length() > 80) {
            throw new ApiException("1003", "room_name không được vượt quá 80 ký tự.", HttpStatus.BAD_REQUEST);
        }

        Room room = roomRepository.save(new Room(
                newId("rm_"),
                ownerId,
                roomName,
                generateInviteCode(),
                maxMembers,
                now,
                now.plus(30, ChronoUnit.MINUTES),
                false));
        return toRoomResponse(room);
    }

    private String generateInviteCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder code = new StringBuilder(6);
            for (int index = 0; index < 6; index++) {
                code.append(INVITE_CHARACTERS.charAt(secureRandom.nextInt(INVITE_CHARACTERS.length())));
            }
            if (!roomRepository.existsByInviteCode(code.toString())) {
                return code.toString();
            }
        }
        throw new IllegalStateException("Không thể tạo mã phòng duy nhất sau nhiều lần thử.");
    }

    private RoomResponse toRoomResponse(Room room) {
        List<RoomResponse.MemberSummary> members = memberRepository.findByRoomIdOrderByJoinedAtAsc(room.getId())
                .stream()
                .map(this::toMemberSummary)
                .toList();
        return new RoomResponse(room.getId(), room.getInviteCode(), room.getExpiresAt(), room.getCreatedAt(), members);
    }

    private JoinRoomResponse toJoinResponse(Room room, RoomMember member) {
        List<RoomResponse.MemberSummary> members = memberRepository.findByRoomIdOrderByJoinedAtAsc(room.getId())
                .stream()
                .map(this::toMemberSummary)
                .toList();
        return new JoinRoomResponse(room.getId(), room.getRoomName(), member.getId(), members);
    }

    private RoomResponse.MemberSummary toMemberSummary(RoomMember member) {
        return new RoomResponse.MemberSummary(
                member.getId(),
                member.getCameraName(),
                member.isOnline() ? "1" : "0");
    }

    private String newId(String prefix) {
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
