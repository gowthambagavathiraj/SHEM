package com.info.shems.repository;

import com.info.shems.model.Device;
import com.info.shems.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByUser(User user);

    Optional<Device> findByDeviceKey(String deviceKey);
}
