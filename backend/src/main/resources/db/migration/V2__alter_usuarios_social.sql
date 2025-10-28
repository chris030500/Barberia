-- db/migration/V2__alter_usuarios_social.sql

-- proveedor_id
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'proveedor_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN proveedor_id VARCHAR(100) NULL',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- proveedor
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'proveedor'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN proveedor VARCHAR(20) NOT NULL DEFAULT ''LOCAL''',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

/* (Opcional) índices únicos si los necesitas y no existen */
-- email único
SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND INDEX_NAME = 'uq_usuarios_email'
);
SET @sql := IF(@idx = 0,
  'CREATE UNIQUE INDEX uq_usuarios_email ON usuarios(email)',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- username único
SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND INDEX_NAME = 'uq_usuarios_username'
);
SET @sql := IF(@idx = 0,
  'CREATE UNIQUE INDEX uq_usuarios_username ON usuarios(username)',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
