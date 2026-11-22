package com.it4409.multicam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "room_members")
public class RoomMember {
    @Id
    private String id;

    @Column(name = "room_id", nullable = false)
    private String roomId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "camera_name", nullable = false)
    private String cameraName;

    @Column(nullable = false)
    private boolean online;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    protected RoomMember() {
    }

    public RoomMember(
            String id,
            String roomId,
            String userId,
            String deviceId,
            String cameraName,
            boolean online,
            Instant joinedAt) {
        this.id = id;
        this.roomId = roomId;
        this.userId = userId;
        this.deviceId = deviceId;
        this.cameraName = cameraName;
        this.online = online;
        this.joinedAt = joinedAt;
    }

    public String getId() { return id; }
    public String getRoomId() { return roomId; }
    public String getUserId() { return userId; }
    public String getDeviceId() { return deviceId; }
    public String getCameraName() { return cameraName; }
    public boolean isOnline() { return online; }
    public Instant getJoinedAt() { return joinedAt; }
}
