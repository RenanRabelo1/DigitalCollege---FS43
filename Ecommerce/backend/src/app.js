import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { query } from "./config/database.js";
import {
  AppError,
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorMiddleware.js";

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");
const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowLocalOrigins = process.env.NODE_ENV !== "production";

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
        origin || "",
      );

      if (
        !origin ||
        configuredOrigins.includes(origin) ||
        (allowLocalOrigins && isLocalOrigin)
      ) {
        return callback(null, true);
      }

      return callback(
        new AppError(403, "ORIGIN_NOT_ALLOWED", "Origem não autorizada pela API."),
      );
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  const result = await query("SELECT NOW() AS now");
  return res.json({ status: "ok", database: "connected", now: result.rows[0].now });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

app.use("/assets", express.static(path.join(projectRoot, "assets"), { dotfiles: "deny" }));
app.use("/data", express.static(path.join(projectRoot, "data"), { dotfiles: "deny" }));
app.use("/pages", express.static(path.join(projectRoot, "pages"), { dotfiles: "deny" }));
app.get("/", (_req, res) => res.redirect("/pages/home/index.html"));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
