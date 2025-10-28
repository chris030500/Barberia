package com.barber.backend.login.repository;

import com.barber.backend.login.model.PhoneOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, Long> {
  Optional<PhoneOtp> findTopByTelefonoE164AndConsumidoFalseOrderByIdDesc(String tel);

  Optional<PhoneOtp> findTopByTelefonoE164AndPurposeAndConsumidoFalseOrderByIdDesc(
      String tel, PhoneOtp.Purpose purpose
  );
}