package com.info.shems.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.info.shems.model.User;
import com.info.shems.model.UserOtp;

public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {

    Optional<UserOtp> findTopByUserAndOtpTypeOrderByCreatedAtDesc(User user, String otpType);

    void deleteByUser(User user);

    // ADD THESE 👇
    void deleteByUserAndOtpType(User user, String otpType);

    Optional<UserOtp> findByUserAndOtpAndOtpType(User user, String otp, String otpType);

    Optional<UserOtp> findByOtpAndOtpType(String otp, String otpType);
}
