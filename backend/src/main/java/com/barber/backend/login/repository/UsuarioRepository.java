package com.barber.backend.login.repository;

import com.barber.backend.login.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
  Optional<Usuario> findByTelefonoE164(String telefonoE164);
  boolean existsByTelefonoE164(String telefonoE164);

  Optional<Usuario> findByProveedorAndProveedorId(Usuario.Proveedor proveedor, String proveedorId);
  Optional<Usuario> findByEmail(String email);
}

