import "dotenv/config";
import app from "./app.js";
import {
  closePool,
  hasDatabaseConfig,
  testConnection,
} from "./config/database.js";

const port = Number(process.env.PORT || 3000);

async function start() {
  if (!hasDatabaseConfig) {
    throw new Error(
      "DATABASE_URL não configurada. Preencha backend/.env com a connection string do Neon.",
    );
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
    throw new Error("JWT_SECRET deve ter ao menos 32 caracteres em backend/.env.");
  }

  const connection = await testConnection();
  console.log(`PostgreSQL conectado ao banco ${connection.database}.`);

  const server = app.listen(port, "0.0.0.0", (error) => {
    if (error) throw error;
    console.log(`Lumina disponível em http://localhost:${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} recebido. Encerrando servidor...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Não foi possível iniciar a API:", error.message);
  process.exitCode = 1;
});
