BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(140) NOT NULL CHECK (char_length(trim(nome)) >= 3),
  email VARCHAR(254) NOT NULL,
  senha_hash VARCHAR(100) NOT NULL,
  telefone VARCHAR(30),
  avatar_url TEXT,
  funcao VARCHAR(60) NOT NULL DEFAULT 'Vendedor',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_uidx
  ON usuarios (LOWER(email));

CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL CHECK (char_length(trim(nome)) >= 2),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS categorias_nome_lower_uidx
  ON categorias (LOWER(nome));

CREATE TABLE IF NOT EXISTS produtos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id BIGINT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  nome VARCHAR(160) NOT NULL CHECK (char_length(trim(nome)) >= 2),
  descricao TEXT NOT NULL CHECK (char_length(trim(descricao)) >= 5),
  preco NUMERIC(12, 2) NOT NULL CHECK (preco > 0),
  preco_original NUMERIC(12, 2) CHECK (preco_original IS NULL OR preco_original > 0),
  imagem_url TEXT NOT NULL CHECK (imagem_url ~* '^https?://'),
  avaliacao_media NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (avaliacao_media BETWEEN 0 AND 5),
  total_avaliacoes INTEGER NOT NULL DEFAULT 0 CHECK (total_avaliacoes >= 0),
  quantidade_vendas INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_vendas >= 0),
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  status VARCHAR(10) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  selo VARCHAR(40),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS produtos_usuario_idx ON produtos (usuario_id);
CREATE INDEX IF NOT EXISTS produtos_categoria_idx ON produtos (categoria_id);
CREATE INDEX IF NOT EXISTS produtos_vendas_idx
  ON produtos (quantidade_vendas DESC, avaliacao_media DESC);
CREATE INDEX IF NOT EXISTS produtos_nome_lower_idx ON produtos (LOWER(nome));

CREATE OR REPLACE FUNCTION definir_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_definir_atualizado_em ON usuarios;
CREATE TRIGGER usuarios_definir_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

DROP TRIGGER IF EXISTS produtos_definir_atualizado_em ON produtos;
CREATE TRIGGER produtos_definir_atualizado_em
BEFORE UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

COMMIT;
