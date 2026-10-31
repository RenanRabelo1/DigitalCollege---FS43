import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listBestSellers,
  listMyProducts,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", listProducts);
router.get("/best-sellers", listBestSellers);
router.get("/mine", requireAuth, listMyProducts);
router.get("/:id", getProduct);
router.post("/", requireAuth, createProduct);
router.put("/:id", requireAuth, updateProduct);
router.delete("/:id", requireAuth, deleteProduct);

export default router;
