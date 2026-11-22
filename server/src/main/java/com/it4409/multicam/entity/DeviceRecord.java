package com.it4409.multicam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "devices")
public class DeviceRecord {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "device_type", nullable = false)
    private int deviceType;

    @Column(name = "device_name", nullable = false)
    private String deviceName;

    @Column(name = "camera_name")
    private String cameraName;

    @Column(name = "last_seen", nullable = false)
    private Instant lastSeen;

    protected DeviceRecord() {
    }

    public DeviceRecord(String id, String userId, int deviceType, String deviceName, String cameraName, Instant lastSeen) {
        this.id = id;
        this.userId = userId;
        this.deviceType = deviceType;
        this.deviceName = deviceName;
        this.cameraName = cameraName;
        this.lastSeen = lastSeen;
    }

    public void update(String deviceName, Instant lastSeen) {
        this.deviceName = deviceName;
        this.lastSeen = lastSeen;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public int getDeviceType() { return deviceType; }
    public String getDeviceName() { return deviceName; }
    public String getCameraName() { return cameraName; }
    public Instant getLastSeen() { return lastSeen; }
}
