package com.info.shems.repository;

import com.info.shems.model.DeviceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeviceScheduleRepository extends JpaRepository<DeviceSchedule, Long> {
    List<DeviceSchedule> findByActive(boolean active);
    List<DeviceSchedule> findByUserEmail(String email);
}
