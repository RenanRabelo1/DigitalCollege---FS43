import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();

const pool = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    })
  : null;

pool?.on("error", (error) => {
  console.error("Erro inesperado em uma conexão ociosa do PostgreSQL:", error.message);
});

function databaseConfigurationError() {
  const error = new Error(
    "DATABASE_URL não configurada. Copie a connection string do Neon para backend/.env.",
  );
  error.status = 503;
  error.code = "DATABASE_NOT_CONFIGURED";
  error.isOperational = true;
  return error;
}

export function getPool() {
  if (!pool) throw databaseConfigurationError();
  return pool;
}

export async function query(text, values = []) {
  return getPool().query(text, values);
}

export async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function testConnection() {
  const result = await query("SELECT current_database() AS database, NOW() AS now");
  return result.rows[0];
}

export async function closePool() {
  if (pool) await pool.end();
}

export const hasDatabaseConfig = Boolean(connectionString);
