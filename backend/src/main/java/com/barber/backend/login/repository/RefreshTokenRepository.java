package com.barber.backend.login.repository;

import com.barber.backend.login.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByTokenHash(String tokenHash);
  void deleteByUsuarioId(Long usuarioId);
}