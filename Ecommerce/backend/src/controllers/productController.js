import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { AppError } from "../middlewares/errorMiddleware.js";

function positiveInteger(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

function validateProduct(body) {
  const name = String(body.name ?? body.nome ?? "").trim();
  const description = String(body.description ?? body.descricao ?? "").trim();
  const price = Number(body.price ?? body.preco);
  const rawOriginalPrice = body.originalPrice ?? body.precoOriginal;
  const originalPrice =
    rawOriginalPrice === undefined || rawOriginalPrice === null || rawOriginalPrice === ""
      ? null
      : Number(rawOriginalPrice);
  const categoryId = String(body.categoryId ?? body.categoriaId ?? "").trim() || null;
  const categoryName = String(
    body.category ?? body.categoryName ?? body.categoria ?? "",
  ).trim() || null;
  const image = String(body.image ?? body.imageUrl ?? body.imagemUrl ?? "").trim();
  const stock = Number(body.stock ?? body.estoque ?? 10);
  const status = body.status === "Inativo" ? "Inativo" : "Ativo";
  const badge = String(body.badge ?? body.selo ?? "").trim() || null;
  const fields = {};

  if (name.length < 2 || name.length > 160) {
    fields.name = "O nome deve ter entre 2 e 160 caracteres.";
  }
  if (description.length < 5 || description.length > 3000) {
    fields.description = "A descrição deve ter entre 5 e 3000 caracteres.";
  }
  if (!Number.isFinite(price) || price <= 0) {
    fields.price = "Informe um preço maior que zero.";
  }
  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= 0)) {
    fields.originalPrice = "O preço original deve ser maior que zero.";
  }
  if (!categoryId && !categoryName) {
    fields.category = "Informe uma categoria existente ou um novo nome de categoria.";
  }
  if (categoryName && (categoryName.length < 2 || categoryName.length > 80)) {
    fields.category = "A categoria deve ter entre 2 e 80 caracteres.";
  }
  if (!Number.isInteger(stock) || stock < 0) {
    fields.stock = "O estoque deve ser um número inteiro maior ou igual a zero.";
  }
  if (badge && badge.length > 40) {
    fields.badge = "O selo deve ter no máximo 40 caracteres.";
  }

  try {
    const url = new URL(image);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    fields.image = "Informe ao menos uma imagem por URL HTTP ou HTTPS válida.";
  }

  if (Object.keys(fields).length) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos obrigatórios do produto.",
      fields,
    );
  }

  return {
    name,
    description,
    price,
    originalPrice,
    categoryId,
    categoryName,
    image,
    stock,
    status,
    badge,
  };
}

export async function listProducts(req, res) {
  const search = String(req.query.search ?? req.query.q ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const sort = String(req.query.sort ?? "relevance").trim();
  const limit = positiveInteger(req.query.limit, 24, 100) || 24;
  const offset = positiveInteger(req.query.offset, 0, 100_000);
  const result = await Product.list({ search, category, sort, limit, offset });

  return res.json({
    data: result.products,
    meta: { total: result.total, limit, offset, search, category, sort },
  });
}

export async function listBestSellers(req, res) {
  const limit = positiveInteger(req.query.limit, 4, 20) || 4;
  const result = await Product.list({ sort: "best_sellers", limit, offset: 0 });
  return res.json({
    data: result.products,
    meta: {
      total: result.total,
      criterion: "quantidade_vendas DESC; avaliação média como desempate",
    },
  });
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Produto não encontrado.");
  }
  return res.json({ data: product });
}

export async function listMyProducts(req, res) {
  const products = await Product.findByOwner(req.user.id);
  return res.json({ data: products, meta: { total: products.length } });
}

export async function createProduct(req, res) {
  const input = validateProduct(req.body || {});

  if (input.categoryId) {
    const category = await Category.findById(input.categoryId);
    if (!category) {
      throw new AppError(
        400,
        "CATEGORY_NOT_FOUND",
        "A categoria informada não existe.",
        { category: "Categoria não encontrada." },
      );
    }
  }

  const product = await Product.create(req.user.id, input);
  return res.status(201).json({
    message: "Produto cadastrado com sucesso.",
    data: product,
  });
}

export async function updateProduct(req, res) {
  const input = validateProduct(req.body || {});

  if (input.categoryId) {
    const category = await Category.findById(input.categoryId);
    if (!category) {
      throw new AppError(
        400,
        "CATEGORY_NOT_FOUND",
        "A categoria informada não existe.",
        { category: "Categoria não encontrada." },
      );
    }
  }

  const product = await Product.updateOwned(req.params.id, req.user.id, input);

  if (!product) {
    throw new AppError(
      404,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado entre os seus cadastros.",
    );
  }

  return res.json({ message: "Produto atualizado com sucesso.", data: product });
}

export async function deleteProduct(req, res) {
  const deleted = await Product.deleteOwned(req.params.id, req.user.id);

  if (!deleted) {
    throw new AppError(
      404,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado entre os seus cadastros.",
    );
  }

  return res.status(204).send();
}
