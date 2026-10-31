import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { createAccessToken } from "../middlewares/authMiddleware.js";
import { AppError } from "../middlewares/errorMiddleware.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function validateRegistration(body) {
  const name = String(body.name ?? body.nome ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? body.senha ?? "");
  const phone = String(body.phone ?? body.telefone ?? "").trim() || null;
  const avatar = String(body.avatar ?? body.avatarUrl ?? "").trim() || null;
  const fields = {};

  if (name.length < 3 || name.length > 140) {
    fields.name = "O nome deve ter entre 3 e 140 caracteres.";
  }
  if (!emailPattern.test(email) || email.length > 254) {
    fields.email = "Informe um e-mail válido com até 254 caracteres.";
  }
  if (password.length < 6) fields.password = "A senha deve ter ao menos 6 caracteres.";
  if (phone && (phone.replace(/\D/g, "").length < 10 || phone.length > 30)) {
    fields.phone = "Informe um telefone válido com até 30 caracteres.";
  }
  if (avatar) {
    try {
      const url = new URL(avatar);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      fields.avatar = "A imagem deve ser uma URL HTTP ou HTTPS válida.";
    }
  }

  if (Object.keys(fields).length) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados.",
      fields,
    );
  }

  return { name, email, password, phone, avatar };
}

export async function register(req, res) {
  const input = validateRegistration(req.body || {});
  const existingUser = await User.findByEmail(input.email);

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "Já existe uma conta cadastrada com este e-mail.",
      { email: "E-mail já cadastrado." },
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    avatar: input.avatar,
  });
  const token = createAccessToken(user);

  return res.status(201).json({
    message: "Conta criada com sucesso.",
    data: publicUser(user),
    token,
  });
}

export async function login(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? req.body?.senha ?? "");

  if (!email || !password) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "E-mail e senha são obrigatórios.",
      {
        ...(!email ? { email: "E-mail é obrigatório." } : {}),
        ...(!password ? { password: "Senha é obrigatória." } : {}),
      },
    );
  }

  const user = await User.findByEmail(email);
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "E-mail ou senha inválidos.",
    );
  }

  return res.json({
    message: "Login realizado com sucesso.",
    data: publicUser(user),
    token: createAccessToken(user),
  });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuário não encontrado.");
  return res.json({ data: user });
}

export async function updateMe(req, res) {
  const current = await User.findById(req.user.id);
  if (!current) throw new AppError(404, "USER_NOT_FOUND", "Usuário não encontrado.");

  const name = String(req.body?.name ?? req.body?.nome ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const phone = String(req.body?.phone ?? req.body?.telefone ?? "").trim();
  const fields = {};

  if (name.length < 3 || name.length > 140) {
    fields.name = "O nome deve ter entre 3 e 140 caracteres.";
  }
  if (!emailPattern.test(email) || email.length > 254) {
    fields.email = "Informe um e-mail válido com até 254 caracteres.";
  }
  if (phone && (phone.replace(/\D/g, "").length < 10 || phone.length > 30)) {
    fields.phone = "Informe um telefone válido com até 30 caracteres.";
  }

  if (Object.keys(fields).length) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados.",
      fields,
    );
  }

  const existingEmailOwner = await User.findByEmail(email);
  if (existingEmailOwner && existingEmailOwner.id !== current.id) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "Este e-mail já pertence a outra conta.",
      { email: "E-mail já cadastrado." },
    );
  }

  const user = await User.updateById(req.user.id, { name, email, phone });
  return res.json({ message: "Dados atualizados com sucesso.", data: user });
}
