create table if not exists refresh_tokens (
  id bigint primary key auto_increment,
  usuario_id bigint not null,
  token_hash varchar(100) not null,
  expira_en timestamp not null,
  revocado boolean not null default false,
  user_agent varchar(255),
  ip varchar(64),
  creado_en timestamp not null default CURRENT_TIMESTAMP,
  index idx_rt_usuario (usuario_id),
  index idx_rt_token_hash (token_hash)
);