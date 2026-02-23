import { Router } from "express";
import {
  createTransaction,
  getTransactionsByUser,
  initializeFlutterwavePayment,
  verifyFlutterwaveTransaction,
  withdraw,
} from "../controllers/transactionController";

const router = Router();

// Route to create a new transaction (e.g., deposit, payment)
router.post("/", createTransaction);

// Route to initialize a Flutterwave payment
router.post("/initialize-flutterwave", initializeFlutterwavePayment);

// Route to verify a Flutterwave transaction (redirect)
router.post("/verify-flutterwave", verifyFlutterwaveTransaction);

// Route for withdrawals
router.post("/withdraw", withdraw);

// Route to get all transactions for a specific user
router.get("/:userId", getTransactionsByUser);

export default router;
