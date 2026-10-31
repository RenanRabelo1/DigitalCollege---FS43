import { query } from "../config/database.js";

function mapCategory(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.nome,
    createdAt: row.criado_em,
  };
}

async function run(executor, text, values = []) {
  return executor?.query ? executor.query(text, values) : query(text, values);
}

export class Category {
  static async list() {
    const result = await query(
      "SELECT id, nome, criado_em FROM categorias ORDER BY nome ASC",
    );
    return result.rows.map(mapCategory);
  }

  static async findById(id, executor = null) {
    const result = await run(
      executor,
      "SELECT id, nome, criado_em FROM categorias WHERE id = $1 LIMIT 1",
      [id],
    );
    return mapCategory(result.rows[0]);
  }

  static async findByName(name, executor = null) {
    const result = await run(
      executor,
      "SELECT id, nome, criado_em FROM categorias WHERE LOWER(nome) = LOWER($1) LIMIT 1",
      [name],
    );
    return mapCategory(result.rows[0]);
  }

  static async create(name, executor = null) {
    const result = await run(
      executor,
      `
        INSERT INTO categorias (nome)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING id, nome, criado_em
      `,
      [name],
    );
    return mapCategory(result.rows[0]);
  }

  static async findOrCreate(name, executor = null) {
    const existing = await this.findByName(name, executor);
    if (existing) return existing;

    const created = await this.create(name, executor);
    return created || this.findByName(name, executor);
  }
}
