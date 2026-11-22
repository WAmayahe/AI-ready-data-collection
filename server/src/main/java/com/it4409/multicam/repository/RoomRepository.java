package com.it4409.multicam.repository;

import com.it4409.multicam.entity.Room;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findFirstByOwnerIdAndClosedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String ownerId,
            Instant now);

    Optional<Room> findByInviteCodeIgnoreCase(String inviteCode);

    boolean existsByInviteCode(String inviteCode);
}
