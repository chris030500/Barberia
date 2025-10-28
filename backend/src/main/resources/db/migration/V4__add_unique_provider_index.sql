ALTER TABLE usuarios
  ADD UNIQUE INDEX uq_usuarios_proveedor_pid (proveedor, proveedor_id);
