package com.info.shems.repository;

import com.info.shems.model.Device;
import com.info.shems.model.EnergyUsage;
import com.info.shems.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface EnergyUsageRepository extends JpaRepository<EnergyUsage, Long> {
    List<EnergyUsage> findByUserAndTimestampBetween(User user, LocalDateTime start, LocalDateTime end);
    List<EnergyUsage> findByDeviceAndTimestampBetween(Device device, LocalDateTime start, LocalDateTime end);
}
