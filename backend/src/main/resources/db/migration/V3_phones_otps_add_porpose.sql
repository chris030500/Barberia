-- Usar VARCHAR para compatibilidad con MySQL 5.7
ALTER TABLE phone_otps
  ADD COLUMN purpose VARCHAR(16) NOT NULL DEFAULT 'LOGIN';

-- Opcional: índice útil para búsquedas
CREATE INDEX idx_phone_otps_tel_purpose
  ON phone_otps (telefono_e164, consumido, purpose);