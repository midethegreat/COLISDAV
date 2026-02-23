import { Router } from "express";
import { handleFlutterwaveWebhook } from "../controllers/webhookController";

const router = Router();

/**
 * @swagger
 * /webhooks/flutterwave:
 *   post:
 *     summary: Handles Flutterwave webhook events
 *     description: Receives and processes webhook notifications from Flutterwave to update transaction statuses and user balances. It includes signature verification to ensure the request is from Flutterwave.
 *     tags: [Webhooks]
 *     requestBody:
 *       description: Flutterwave webhook payload
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.completed"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123456
 *                   tx_ref:
 *                     type: string
 *                     example: "COLISDAV-1629892839443"
 *                   status:
 *                     type: string
 *                     example: "successful"
 *                   amount:
 *                     type: number
 *                     example: 100
 *                   currency:
 *                     type: string
 *                     example: "NGN"
 *     responses:
 *       '200':
 *         description: Webhook received and processed successfully.
 *       '400':
 *         description: Bad Request - Invalid payload.
 *       '401':
 *         description: Unauthorized - Invalid signature.
 *       '500':
 *         description: Internal Server Error.
 */
router.post("/flutterwave", handleFlutterwaveWebhook);

export default router;
