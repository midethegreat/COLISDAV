import { Router } from "express";
import { handleFlutterwaveWebhook } from "../controllers/webhookController";

const router = Router();

router.post("/flutterwave", handleFlutterwaveWebhook);

export default router;
