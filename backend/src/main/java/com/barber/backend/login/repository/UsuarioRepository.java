package com.barber.backend.login.repository;

import com.barber.backend.login.model.Usuario;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByFirebaseUid(String firebaseUid);

    Optional<Usuario> findByTelefonoE164(String telefonoE164);

    long countByRolAndActivoTrue(Usuario.Rol rol);

    long countByRolAndTelefonoVerificadoTrue(Usuario.Rol rol);

    long countByRolAndCreadoEnBetween(Usuario.Rol rol, Instant desde, Instant hasta);
}

