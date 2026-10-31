import jwt from "jsonwebtoken";
import { AppError } from "./errorMiddleware.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new AppError(
      503,
      "AUTH_NOT_CONFIGURED",
      "JWT_SECRET deve ter ao menos 32 caracteres no arquivo backend/.env.",
    );
  }

  return secret;
}

export function createAccessToken(user) {
  return jwt.sign(
    { email: user.email },
    getJwtSecret(),
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "lumina-api",
      audience: "lumina-web",
    },
  );
}

export function requireAuth(req, _res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(401, "AUTH_REQUIRED", "Faça login para acessar este recurso."),
    );
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "lumina-api",
      audience: "lumina-web",
    });

    req.user = {
      id: String(payload.sub),
      email: payload.email,
    };
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);

    return next(
      new AppError(
        401,
        "INVALID_TOKEN",
        "Sua sessão é inválida ou expirou. Faça login novamente.",
      ),
    );
  }
}
