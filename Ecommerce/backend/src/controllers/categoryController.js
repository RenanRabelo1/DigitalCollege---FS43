import { Category } from "../models/Category.js";
import { AppError } from "../middlewares/errorMiddleware.js";

export async function listCategories(_req, res) {
  const categories = await Category.list();
  return res.json({ data: categories });
}

export async function createCategory(req, res) {
  const name = String(req.body?.name ?? req.body?.nome ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "O nome da categoria deve ter entre 2 e 80 caracteres.",
      { name: "Categoria inválida." },
    );
  }

  const existing = await Category.findByName(name);
  if (existing) return res.status(200).json({ data: existing });

  const category = await Category.create(name);
  return res.status(201).json({
    message: "Categoria criada com sucesso.",
    data: category,
  });
}
