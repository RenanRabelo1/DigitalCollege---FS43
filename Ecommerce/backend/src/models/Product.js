import { query, withTransaction } from "../config/database.js";
import { Category } from "./Category.js";

const productFields = `
    p.id,
    p.usuario_id,
    p.nome,
    p.descricao,
    p.preco,
    p.preco_original,
    p.imagem_url,
    p.avaliacao_media,
    p.total_avaliacoes,
    p.quantidade_vendas,
    p.estoque,
    p.status,
    p.selo,
    p.criado_em,
    p.atualizado_em,
    c.id AS categoria_id,
    c.nome AS categoria_nome,
    u.nome AS vendedor_nome
`;

const productFrom = `
  FROM produtos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  INNER JOIN usuarios u ON u.id = p.usuario_id
`;

const productSelection = `SELECT ${productFields} ${productFrom}`;

function mapProduct(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.nome,
    description: row.descricao,
    price: Number(row.preco),
    originalPrice: row.preco_original === null ? null : Number(row.preco_original),
    category: row.categoria_nome,
    categoryId: String(row.categoria_id),
    image: row.imagem_url,
    rating: Number(row.avaliacao_media),
    reviewCount: Number(row.total_avaliacoes),
    salesCount: Number(row.quantidade_vendas),
    stock: Number(row.estoque),
    status: row.status,
    badge: row.selo,
    ownerId: String(row.usuario_id),
    sellerName: row.vendedor_nome,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  };
}

async function resolveCategory({ categoryId, categoryName }, executor) {
  if (categoryId) return Category.findById(categoryId, executor);
  if (categoryName) return Category.findOrCreate(categoryName, executor);
  return null;
}

export class Product {
  static async list({ search = "", category = "", sort = "relevance", limit = 24, offset = 0 }) {
    const values = [];
    const conditions = ["p.status = 'Ativo'"];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(
        p.nome ILIKE $${values.length}
        OR p.descricao ILIKE $${values.length}
        OR c.nome ILIKE $${values.length}
      )`);
    }

    if (category) {
      values.push(category);
      conditions.push(`LOWER(c.nome) = LOWER($${values.length})`);
    }

    const orderBy = {
      relevance: "p.quantidade_vendas DESC, p.avaliacao_media DESC, p.criado_em DESC",
      best_sellers: "p.quantidade_vendas DESC, p.avaliacao_media DESC, p.criado_em DESC",
      price_asc: "p.preco ASC, p.id ASC",
      price_desc: "p.preco DESC, p.id ASC",
      rating: "p.avaliacao_media DESC, p.total_avaliacoes DESC, p.id ASC",
      recent: "p.criado_em DESC, p.id DESC",
    }[sort] || "p.quantidade_vendas DESC, p.avaliacao_media DESC, p.criado_em DESC";

    values.push(limit, offset);
    const limitPosition = values.length - 1;
    const offsetPosition = values.length;
    const result = await query(
      `
        SELECT ${productFields}, COUNT(*) OVER() AS total_count
        ${productFrom}
        WHERE ${conditions.join(" AND ")}
        ORDER BY ${orderBy}
        LIMIT $${limitPosition}
        OFFSET $${offsetPosition}
      `,
      values,
    );

    return {
      products: result.rows.map(mapProduct),
      total: Number(result.rows[0]?.total_count || 0),
    };
  }

  static async findById(id) {
    const result = await query(
      `${productSelection} WHERE p.id = $1 LIMIT 1`,
      [id],
    );
    return mapProduct(result.rows[0]);
  }

  static async findByOwner(userId) {
    const result = await query(
      `${productSelection} WHERE p.usuario_id = $1 ORDER BY p.criado_em DESC, p.id DESC`,
      [userId],
    );
    return result.rows.map(mapProduct);
  }

  static async create(userId, input) {
    const createdId = await withTransaction(async (client) => {
      const category = await resolveCategory(input, client);
      if (!category) return null;

      const result = await client.query(
        `
          INSERT INTO produtos (
            usuario_id, categoria_id, nome, descricao, preco, preco_original,
            imagem_url, estoque, status, selo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
        [
          userId,
          category.id,
          input.name,
          input.description,
          input.price,
          input.originalPrice,
          input.image,
          input.stock,
          input.status,
          input.badge,
        ],
      );

      return result.rows[0].id;
    });

    return createdId ? this.findById(createdId) : null;
  }

  static async updateOwned(id, userId, input) {
    const updatedId = await withTransaction(async (client) => {
      const ownedProduct = await client.query(
        "SELECT id FROM produtos WHERE id = $1 AND usuario_id = $2 FOR UPDATE",
        [id, userId],
      );

      if (!ownedProduct.rowCount) return null;

      const category = await resolveCategory(input, client);
      if (!category) return null;

      const result = await client.query(
        `
          UPDATE produtos
          SET categoria_id = $3,
              nome = $4,
              descricao = $5,
              preco = $6,
              preco_original = $7,
              imagem_url = $8,
              estoque = $9,
              status = $10,
              selo = $11,
              atualizado_em = NOW()
          WHERE id = $1 AND usuario_id = $2
          RETURNING id
        `,
        [
          id,
          userId,
          category.id,
          input.name,
          input.description,
          input.price,
          input.originalPrice,
          input.image,
          input.stock,
          input.status,
          input.badge,
        ],
      );

      return result.rows[0]?.id || null;
    });

    return updatedId ? this.findById(updatedId) : null;
  }

  static async deleteOwned(id, userId) {
    const result = await query(
      "DELETE FROM produtos WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, userId],
    );
    return Boolean(result.rowCount);
  }
}
