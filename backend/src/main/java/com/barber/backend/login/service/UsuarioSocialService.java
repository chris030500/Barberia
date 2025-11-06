// src/main/java/com/barber/backend/login/service/UsuarioSocialService.java
package com.barber.backend.login.service;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioSocialService {
  private static final Logger log = LoggerFactory.getLogger(UsuarioSocialService.class);

  private final UsuarioRepository repo;

  public UsuarioSocialService(UsuarioRepository repo) {
    this.repo = repo;
  }

  private Usuario.Proveedor mapProvider(String firebaseProvider) {
    if (firebaseProvider == null) return Usuario.Proveedor.FIREBASE; // o LOCAL
    switch (firebaseProvider) {
      case "google.com":   return Usuario.Proveedor.GOOGLE;
      case "facebook.com": return Usuario.Proveedor.FACEBOOK;
      case "phone":        return Usuario.Proveedor.PHONE;
      default:             return Usuario.Proveedor.FIREBASE; // genérico
    }
  }

  @Transactional
  public Usuario getOrCreateFromFirebase(String uid,
                                         String email,
                                         String nombre,
                                         String avatarUrl,
                                         String phoneE164,
                                         String firebaseProvider) {
    return repo.findByFirebaseUid(uid)
        .map(u -> {
          // update
          if (email != null && !email.isBlank()) u.setEmail(email);
          String normalizedNombre = normalizeNombre(nombre);
          if (normalizedNombre != null) {
            u.setNombre(normalizedNombre);
          } else if (isPlaceholderNombre(u.getNombre())) {
            u.setNombre(null);
          }
          if (avatarUrl != null && !avatarUrl.isBlank()) u.setAvatarUrl(avatarUrl);
          if (phoneE164 != null && !phoneE164.isBlank()) {
            String tel = phoneE164.trim();
            if (canAssignPhone(tel, u.getId())) {
              u.setTelefonoE164(tel);
              u.setTelefonoVerificado(true);
            } else {
              log.warn(
                  "No se asignó teléfono {} al usuario {} porque ya pertenece a otra cuenta",
                  tel,
                  u.getId());
            }
          }
          u.setProveedor(mapProvider(firebaseProvider));
          u.setProveedorId(uid);
          // defaults de seguridad
          if (u.getApellido() == null) u.setApellido("N/A");
          if (isPlaceholderNombre(u.getNombre())) u.setNombre(null);
          u.setActivo(true);
          return repo.save(u);
        })
        .orElseGet(() -> {
          // create
          Usuario nuevo = new Usuario();
          nuevo.setFirebaseUid(uid);
          nuevo.setEmail(email);
          String nuevoNombre = normalizeNombre(nombre);
          if (nuevoNombre != null) {
            nuevo.setNombre(nuevoNombre);
          }
          nuevo.setApellido("N/A"); // <- evita NOT NULL
          nuevo.setAvatarUrl(avatarUrl);
          if (phoneE164 != null && !phoneE164.isBlank()) {
            String tel = phoneE164.trim();
            if (canAssignPhone(tel, null)) {
              nuevo.setTelefonoE164(tel);
              nuevo.setTelefonoVerificado(true);
            } else {
              log.warn(
                  "No se guardó el teléfono {} para el nuevo usuario con uid {} porque ya existe", tel, uid);
              nuevo.setTelefonoVerificado(false);
            }
          } else {
            nuevo.setTelefonoVerificado(false);
          }
          nuevo.setProveedor(mapProvider(firebaseProvider));
          nuevo.setProveedorId(uid);
          nuevo.setActivo(true);
          return repo.save(nuevo);
        });
  }

  private static String normalizeNombre(String nombre) {
    if (nombre == null) {
      return null;
    }
    String trimmed = nombre.trim();
    if (trimmed.isEmpty()) {
      return null;
    }
    return isPlaceholderNombre(trimmed) ? null : trimmed;
  }

  private static boolean isPlaceholderNombre(String nombre) {
    return nombre != null && nombre.trim().equalsIgnoreCase("usuario");
  }

  private boolean canAssignPhone(String telefono, Long usuarioId) {
    return repo.findByTelefonoE164(telefono)
        .map(existing -> usuarioId != null && existing.getId().equals(usuarioId))
        .orElse(true);
  }
}
