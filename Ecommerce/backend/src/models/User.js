import { query } from "../config/database.js";

function mapUser(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.nome,
    email: row.email,
    phone: row.telefone,
    avatar: row.avatar_url,
    role: row.funcao,
    joinYear: new Date(row.criado_em).getFullYear(),
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  };
}

export class User {
  static async create({ name, email, passwordHash, phone = null, avatar = null }) {
    const result = await query(
      `
        INSERT INTO usuarios (nome, email, senha_hash, telefone, avatar_url)
        VALUES ($1, LOWER($2), $3, $4, $5)
        RETURNING id, nome, email, telefone, avatar_url, funcao, criado_em, atualizado_em
      `,
      [name, email, passwordHash, phone, avatar],
    );

    return mapUser(result.rows[0]);
  }

  static async findByEmail(email) {
    const result = await query(
      `
        SELECT id, nome, email, senha_hash, telefone, avatar_url, funcao,
               criado_em, atualizado_em
        FROM usuarios
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      ...mapUser(row),
      passwordHash: row.senha_hash,
    };
  }

  static async findById(id) {
    const result = await query(
      `
        SELECT id, nome, email, telefone, avatar_url, funcao, criado_em, atualizado_em
        FROM usuarios
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return mapUser(result.rows[0]);
  }

  static async updateById(id, { name, email, phone }) {
    const result = await query(
      `
        UPDATE usuarios
        SET nome = $2,
            email = LOWER($3),
            telefone = $4,
            atualizado_em = NOW()
        WHERE id = $1
        RETURNING id, nome, email, telefone, avatar_url, funcao, criado_em, atualizado_em
      `,
      [id, name, email, phone || null],
    );

    return mapUser(result.rows[0]);
  }
}
