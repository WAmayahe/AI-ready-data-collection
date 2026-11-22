package com.it4409.multicam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    private String id;

    @Column(name = "owner_id", nullable = false)
    private String ownerId;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "invite_code", nullable = false, unique = true, length = 6)
    private String inviteCode;

    @Column(name = "max_members", nullable = false)
    private int maxMembers;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean closed;

    protected Room() {
    }

    public Room(
            String id,
            String ownerId,
            String roomName,
            String inviteCode,
            int maxMembers,
            Instant createdAt,
            Instant expiresAt,
            boolean closed) {
        this.id = id;
        this.ownerId = ownerId;
        this.roomName = roomName;
        this.inviteCode = inviteCode;
        this.maxMembers = maxMembers;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.closed = closed;
    }

    public String getId() { return id; }
    public String getOwnerId() { return ownerId; }
    public String getRoomName() { return roomName; }
    public String getInviteCode() { return inviteCode; }
    public int getMaxMembers() { return maxMembers; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isClosed() { return closed; }
}
