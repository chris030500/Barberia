// src/main/java/com/barber/backend/login/service/UsuarioSocialService.java
package com.barber.backend.login.service;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioSocialService {
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
          if (nombre != null && !nombre.isBlank()) u.setNombre(nombre);
          if (avatarUrl != null && !avatarUrl.isBlank()) u.setAvatarUrl(avatarUrl);
          if (phoneE164 != null && !phoneE164.isBlank()) {
            u.setTelefonoE164(phoneE164);
            u.setTelefonoVerificado(true);
          }
          u.setProveedor(mapProvider(firebaseProvider));
          u.setProveedorId(uid);
          // defaults de seguridad
          if (u.getApellido() == null) u.setApellido("N/A");
          if (u.getNombre() == null || u.getNombre().isBlank()) u.setNombre("Usuario");
          u.setActivo(true);
          return repo.save(u);
        })
        .orElseGet(() -> {
          // create
          Usuario nuevo = new Usuario();
          nuevo.setFirebaseUid(uid);
          nuevo.setEmail(email);
          nuevo.setNombre((nombre != null && !nombre.isBlank()) ? nombre : "Usuario");
          nuevo.setApellido("N/A"); // <- evita NOT NULL
          nuevo.setAvatarUrl(avatarUrl);
          if (phoneE164 != null && !phoneE164.isBlank()) {
            nuevo.setTelefonoE164(phoneE164);
            nuevo.setTelefonoVerificado(true);
          } else {
            nuevo.setTelefonoVerificado(false);
          }
          nuevo.setProveedor(mapProvider(firebaseProvider));
          nuevo.setProveedorId(uid);
          nuevo.setActivo(true);
          return repo.save(nuevo);
        });
  }
}
