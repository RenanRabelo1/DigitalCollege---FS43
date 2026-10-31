import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, query } from "./database.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const databaseDirectory = path.resolve(currentDirectory, "../../../database");

async function run() {
  const schema = await readFile(path.join(databaseDirectory, "schema.sql"), "utf8");
  const seed = await readFile(path.join(databaseDirectory, "seed.sql"), "utf8");

  await query(schema);
  await query(seed);
  console.log("Banco configurado e dados iniciais inseridos com sucesso.");
}

run()
  .catch((error) => {
    console.error("Não foi possível configurar o banco:", error.message);
    process.exitCode = 1;
  })
  .finally(closePool);
