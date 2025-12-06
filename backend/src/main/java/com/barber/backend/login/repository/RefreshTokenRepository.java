package com.barber.backend.login.repository;

import com.barber.backend.login.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByTokenHash(String tokenHash);
  Optional<RefreshToken> findByJti(String jti);

  @Modifying(clearAutomatically = true)
  @Query("update RefreshToken rt set rt.revocado = true where rt.usuarioId = :userId")
  void revokeAllByUsuarioId(@Param("userId") Long userId);

  @Modifying(clearAutomatically = true)
  @Query("update RefreshToken rt set rt.revocado = true where rt.jti = :jti")
  void revokeByJti(@Param("jti") String jti);
  void deleteByUsuarioId(Long usuarioId);
}