// src/main/java/com/barber/backend/login/dto/UsuarioMeDTO.java
package com.barber.backend.login.dto;

public record UsuarioMeDTO(
  Long id,
  String nombre,
  String apellido,
  String email,
  String username,
  String telefonoE164,
  boolean telefonoVerificado,
  String proveedor,    // LOCAL | GOOGLE | FACEBOOK
  String proveedorId,
  String avatarUrl
) {}
