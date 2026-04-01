package com.info.shems.repository;

import com.info.shems.model.SystemPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SystemPolicyRepository extends JpaRepository<SystemPolicy, Long> {
    Optional<SystemPolicy> findByPolicyKey(String policyKey);
}
