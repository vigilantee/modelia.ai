import { Router } from "express";
import { GenerationController } from "../controllers/generation.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate);

router.post("/", upload.single("image") as any, GenerationController.create);
router.get("/recent", GenerationController.getRecent);
router.get("/:id", GenerationController.getById);

export default router;
