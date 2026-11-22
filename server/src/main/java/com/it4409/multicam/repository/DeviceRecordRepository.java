package com.it4409.multicam.repository;

import com.it4409.multicam.entity.DeviceRecord;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRecordRepository extends JpaRepository<DeviceRecord, String> {
    Optional<DeviceRecord> findByIdAndUserId(String id, String userId);
}
