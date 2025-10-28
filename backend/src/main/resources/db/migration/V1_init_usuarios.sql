-- V1__init_auth.sql
-- Estructura mínima para autenticación con teléfono (OTP)
-- + deja listo email/username por si luego los usas.

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,

  -- Campos de login (opcionales al inicio)
  email             VARCHAR(150) NULL,
  username          VARCHAR(60)  NULL,

  -- Password (si luego habilitas login clásico). Por ahora puede quedar "placeholder".
  password_hash     VARCHAR(255) NOT NULL DEFAULT '$2a$10$placeholderplaceholderplaceholderpl',

  -- Teléfono en formato E.164, p. ej. +5215512345678
  telefono_e164     VARCHAR(20)  NULL,
  telefono_verificado TINYINT(1) NOT NULL DEFAULT 0,

  proveedor         ENUM('LOCAL','GOOGLE','FACEBOOK') DEFAULT 'LOCAL',

  creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Unicidad (MySQL 5.7 permite múltiples NULLs en UNIQUE)
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_username (username),
  UNIQUE KEY uq_usuarios_telefono (telefono_e164)
);

-- Tabla para códigos OTP de teléfono
CREATE TABLE IF NOT EXISTS phone_otps (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  telefono_e164   VARCHAR(20) NOT NULL,
  code_hash       VARCHAR(100) NOT NULL,   -- guarda SOLO hash (BCrypt, etc.)
  vence_en        TIMESTAMP NOT NULL,      -- ahora + 5 minutos, por ejemplo
  intentos        INT NOT NULL DEFAULT 0,
  max_intentos    INT NOT NULL DEFAULT 5,
  canal           ENUM('SMS','WHATSAPP') DEFAULT 'SMS',
  consumido       TINYINT(1) NOT NULL DEFAULT 0,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_phone_otps_phone (telefono_e164)
);

-- (Opcional) Semilla de ejemplo para probar lecturas (quítala en prod)
INSERT INTO usuarios (nombre, apellido, email, username, telefono_e164, telefono_verificado)
VALUES ('Demo', 'User', NULL, NULL, NULL, 0);
