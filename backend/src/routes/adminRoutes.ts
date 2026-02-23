import { Router } from "express";
import { handleBroadcast } from "../controllers/adminController";

const router = Router();

router.post("/broadcast", handleBroadcast);

export default router;
