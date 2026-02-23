import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { User } from "../entities/User";
import { flutterwaveConfig } from "../constants/flutterwaveConfig";
import { sendNotification } from "../notificationService";

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

/**
 * @desc    Handle Flutterwave webhook events
 * @route   POST /api/webhooks/flutterwave
 * @access  Public (Secured by signature verification)
 */
export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  // 1. SECURITY: Verify the webhook signature
  const signature = req.headers["verif-hash"] as string;
  if (!signature || signature !== flutterwaveConfig.webhookSecretHash) {
    console.warn("[WEBHOOK] Invalid signature received.");
    return res.status(401).send("Invalid signature");
  }

  const payload = req.body;
  console.log("[WEBHOOK] Received Flutterwave event:", payload.event);
  console.log("[WEBHOOK] Payload data:", JSON.stringify(payload.data, null, 2));

  // We are only interested in successful charge events
  if (payload.event !== "charge.completed") {
    return res.status(200).send("Event not relevant, but acknowledged.");
  }

  const transactionDetails = payload.data;

  // 2. IDEMPOTENCY: Prevent double crediting
  // Check if this transaction has already been successfully processed
  const existingTransaction = await transactionRepository.findOne({
    where: { providerTransactionId: transactionDetails.id.toString() },
  });

  if (existingTransaction && existingTransaction.status === "success") {
    console.log(
      `[WEBHOOK] Transaction ${transactionDetails.id} already processed. Acknowledging.`,
    );
    return res.status(200).send("Transaction already processed.");
  }

  // 3. AUTHORITATIVE VERIFICATION: Verify the transaction with Flutterwave API
  try {
    console.log(
      `[WEBHOOK] Verifying transaction ID ${transactionDetails.id} with Flutterwave API.`,
    );
    const verificationResponse = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionDetails.id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveConfig.secretKey}`,
        },
      },
    );

    const verifiedData = verificationResponse.data.data;

    // Double-check the final status from the API
    if (verifiedData.status !== "successful") {
      console.warn(
        `[WEBHOOK] Transaction ${verifiedData.id} verification failed. Status: ${verifiedData.status}`,
      );
      // Optionally, update the transaction in your DB to 'failed' here
      return res.status(400).send("Transaction not successful.");
    }

    // 4. PROCESS THE TRANSACTION: Find the original transaction and user
    const tx_ref = verifiedData.tx_ref;
    const localTransaction = await transactionRepository.findOne({
      where: { reference: tx_ref },
      relations: ["user"],
    });

    if (!localTransaction) {
      console.error(
        `[WEBHOOK] CRITICAL: No local transaction found for tx_ref: ${tx_ref}`,
      );
      // Although we couldn't find it, the payment was successful.
      // This might be a good place to create a new transaction record or flag for manual review.
      return res.status(404).send("Local transaction not found.");
    }

    if (localTransaction.status === "success") {
      console.log(
        `[WEBHOOK] Local transaction for tx_ref ${tx_ref} already marked as success. Acknowledging.`,
      );
      return res.status(200).send("Transaction already processed.");
    }

    // Security Check: Ensure amounts match
    if (Number(verifiedData.amount) < localTransaction.amount) {
      console.error(
        `[WEBHOOK] Amount mismatch for tx_ref: ${tx_ref}. Expected ${localTransaction.amount}, got ${verifiedData.amount}.`,
      );
      localTransaction.status = "failed";
      await transactionRepository.save(localTransaction);
      return res.status(400).send("Amount mismatch.");
    }

    // 5. DATABASE UPDATE: Update balance and transaction status
    const user = localTransaction.user;
    const oldBalance = user.walletBalance;
    user.walletBalance =
      Number(user.walletBalance) + Number(verifiedData.amount);

    localTransaction.status = "success";
    localTransaction.providerTransactionId = verifiedData.id.toString(); // Store the unique ID from Flutterwave

    // Use a database transaction to ensure both updates succeed or fail together
    await AppDataSource.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(user);
        await transactionalEntityManager.save(localTransaction);
      },
    );

    console.log(
      `[WEBHOOK] SUCCESS: User ${user.id} wallet updated. Old: ${oldBalance}, New: ${user.walletBalance}`,
    );

    // Send a success notification
    await sendNotification(
      user.id,
      "Deposit Successful",
      `Your wallet has been credited with ${verifiedData.amount} NGN.`,
    );

    // Acknowledge the webhook with a 200 OK
    res.status(200).send("Webhook processed successfully.");
  } catch (error) {
    console.error(
      "[WEBHOOK] CATCH BLOCK: Error processing webhook:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).send("Internal server error.");
  }
};
