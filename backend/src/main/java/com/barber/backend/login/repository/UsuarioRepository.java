package com.barber.backend.login.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.barber.backend.login.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByFirebaseUid(String firebaseUid);
}

