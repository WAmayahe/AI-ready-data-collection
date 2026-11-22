package com.it4409.multicam.repository;

import com.it4409.multicam.entity.RoomMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomMemberRepository extends JpaRepository<RoomMember, String> {
    List<RoomMember> findByRoomIdOrderByJoinedAtAsc(String roomId);
    Optional<RoomMember> findFirstByRoomIdAndUserId(String roomId, String userId);
    Optional<RoomMember> findFirstByUserId(String userId);
    long countByRoomId(String roomId);
}
