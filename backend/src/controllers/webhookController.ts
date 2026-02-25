import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Transaction, TransactionStatus } from "../entities/Transaction";
import { User } from "../entities/User";
import { flutterwaveConfig } from "../constants/flutterwaveConfig";
import { sendNotification } from "../notificationService";
import axios from "axios";

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["verif-hash"] as string;

  if (!signature || signature !== flutterwaveConfig.webhookSecretHash) {
    console.warn("[WEBHOOK] Invalid signature received.");
    return res.status(401).send("Invalid signature");
  }

  const payload = req.body;
  console.log("[WEBHOOK] Received Flutterwave payload:", payload);

  if (
    payload.event === "charge.completed" &&
    payload.data.status === "successful"
  ) {
    const transactionDetails = payload.data;
    const {
      tx_ref: flutterwaveTxRef,
      id: transaction_id,
      amount,
      currency,
    } = transactionDetails;

    try {
      // 1. Verify the transaction with Flutterwave to prevent spoofing
      const verificationResponse = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${flutterwaveConfig.secretKey}`,
          },
        },
      );

      const verificationData = verificationResponse.data;
      if (
        verificationData.status !== "success" ||
        verificationData.data.status !== "successful"
      ) {
        console.error(
          "[WEBHOOK] Transaction verification failed with Flutterwave:",
          verificationData,
        );
        return res.status(400).send("Transaction verification failed.");
      }

      // 2. Find the corresponding transaction in your database
      const transaction = await transactionRepository.findOne({
        where: {
          reference: flutterwaveTxRef,
          status: TransactionStatus.PENDING,
        },
        relations: ["user"],
      });

      if (!transaction) {
        console.log(
          `[WEBHOOK] Transaction with ref ${flutterwaveTxRef} not found or already processed.`,
        );
        // Respond with 200 to acknowledge receipt and prevent retries for already processed transactions.
        return res
          .status(200)
          .send("Transaction already processed or not found.");
      }

      // 3. Check for amount and currency mismatch
      if (
        verificationData.data.amount < transaction.amount ||
        verificationData.data.currency !== "NGN"
      ) {
        transaction.status = TransactionStatus.FAILED;
        await transactionRepository.save(transaction);
        console.log(
          `[WEBHOOK] Transaction failed due to amount/currency mismatch for ref: ${flutterwaveTxRef}`,
        );
        return res.status(400).send("Transaction mismatch.");
      }

      // 4. Update transaction status and user balance
      transaction.status = TransactionStatus.COMPLETED;
      await transactionRepository.save(transaction);

      const user = transaction.user;
      user.walletBalance += transaction.amount;
      await userRepository.save(user);

      console.log(
        `[WEBHOOK] User ${user.email}'s wallet credited with ${transaction.amount}. New balance: ${user.walletBalance}`,
      );

      // 5. Send a success notification
      await sendNotification(
        user.id,
        "Deposit Successful",
        `Your wallet has been credited with ₦${transaction.amount}. Your new balance is ₦${user.walletBalance}.`,
      );

      res.status(200).send("Webhook processed successfully.");
    } catch (error: any) {
      console.error("[WEBHOOK] Error processing webhook:", error);
      res.status(500).send("Internal server error.");
    }
  } else {
    // Acknowledge other event types without processing
    res.status(200).send("Event received.");
  }
};
