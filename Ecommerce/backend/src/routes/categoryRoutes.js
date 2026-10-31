import { Router } from "express";
import {
  createCategory,
  listCategories,
} from "../controllers/categoryController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAuth, createCategory);

export default router;
