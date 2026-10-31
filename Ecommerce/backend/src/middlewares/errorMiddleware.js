export class AppError extends Error {
  constructor(status, code, message, fields = undefined) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
  }
}

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `A rota ${req.method} ${req.originalUrl} não foi encontrada.`,
    ),
  );
}

function normalizeDatabaseError(error) {
  if (error.code === "23505") {
    return new AppError(409, "DUPLICATE_RESOURCE", "Este registro já existe.");
  }

  if (error.code === "23503") {
    return new AppError(
      400,
      "INVALID_RELATION",
      "O registro informado está relacionado a um dado inexistente.",
    );
  }

  if (error.code === "22P02") {
    return new AppError(400, "INVALID_IDENTIFIER", "O identificador informado é inválido.");
  }

  if (error.code === "23514" || error.code === "22001") {
    return new AppError(
      400,
      "INVALID_FIELD_VALUE",
      "Um dos campos possui um valor fora do formato permitido.",
    );
  }

  return error;
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);

  const normalized = normalizeDatabaseError(error);
  const status = normalized.status || normalized.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (!normalized.isOperational) {
    console.error(normalized);
  }

  const payload = {
    error: {
      code: normalized.code || "INTERNAL_ERROR",
      message:
        status === 500 && isProduction
          ? "Ocorreu um erro interno. Tente novamente mais tarde."
          : normalized.message || "Ocorreu um erro interno.",
    },
  };

  if (normalized.fields) payload.error.fields = normalized.fields;
  if (!isProduction && status === 500) payload.error.stack = normalized.stack;

  return res.status(status).json(payload);
}
