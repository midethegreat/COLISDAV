import { Request, Response } from "express";
import axios from "axios"; // Import axios
import { AppDataSource } from "../data-source";
import { Transaction, TransactionType } from "../entities/Transaction";
import { User } from "../entities/User";
import { sendNotification } from "../notificationService";
import { flutterwaveConfig } from "../constants/flutterwaveConfig";

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

export const createTransaction = async (req: Request, res: Response) => {
  const { userId, type, amount } = req.body;

  if (!userId || !type || !amount) {
    return res
      .status(400)
      .json({ message: "Missing required fields: userId, type, or amount." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create and save the new transaction
    const transaction = new Transaction();
    transaction.user = user;
    transaction.type = type;
    transaction.amount = amount;

    // Update user's wallet balance based on transaction type
    if (type === TransactionType.DEPOSIT) {
      user.walletBalance += amount;
      await userRepository.save(user);
      await transactionRepository.save(transaction);

      // Send notification for deposit
      await sendNotification(
        user.id,
        "Deposit Successful",
        `Your wallet has been credited with ${amount}. Your new balance is ${user.walletBalance}.`,
      );
    } else if (
      type === TransactionType.PAYMENT ||
      type === TransactionType.WITHDRAWAL
    ) {
      if (user.walletBalance < amount) {
        return res
          .status(400)
          .json({ message: "Insufficient wallet balance." });
      }
      user.walletBalance -= amount;
      await userRepository.save(user);
      await transactionRepository.save(transaction);
    }

    console.log(
      `Transaction created for user ${user.email}: ${type} of ${amount}`,
    );
    return res.status(201).json({
      message: "Transaction created successfully.",
      transaction,
      newBalance: user.walletBalance,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ message: "Failed to create transaction." });
  }
};

export const initializeFlutterwavePayment = async (
  req: Request,
  res: Response,
) => {
  const { userId, amount, email, phoneNumber, fullName } = req.body;

  if (!userId || !amount || !email || !phoneNumber || !fullName) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const transactionRef = `CAMPUSRIDE_${Date.now()}`;

    const payload = {
      tx_ref: transactionRef,
      amount,
      currency: "NGN",
      redirect_url: "https://cid.dev/wallet",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email,
        phonenumber: phoneNumber,
        name: fullName,
      },
      customizations: {
        title: "CampusRide Wallet Deposit",
        description: "Fund your CampusRide wallet",
        logo: "https://your-app.com/logo.png",
      },
    };

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveConfig.secretKey}`,
        },
      },
    );

    if (response.data.status === "success") {
      const newTransaction = new Transaction();
      newTransaction.user = user;
      newTransaction.amount = parseFloat(amount);
      newTransaction.type = TransactionType.DEPOSIT;
      newTransaction.reference = transactionRef;
      newTransaction.status = "pending";
      await transactionRepository.save(newTransaction);

      res.status(200).json({ link: response.data.data.link });
    } else {
      throw new Error("Failed to initialize payment.");
    }
  } catch (error) {
    console.error("Error initializing Flutterwave payment:", error);
    res
      .status(500)
      .json({ message: "Failed to initialize payment.", error: error.message });
  }
};

export const verifyFlutterwaveTransaction = async (
  req: Request,
  res: Response,
) => {
  const { tx_ref, transaction_id } = req.body;
  console.log("[BACKEND VERIFY] Request received with body:", req.body);

  if (!transaction_id) {
    console.log("[BACKEND VERIFY] Error: Missing transaction_id.");
    return res.status(400).json({ message: "Transaction ID is required." });
  }

  try {
    console.log(
      `[BACKEND VERIFY] Verifying with Flutterwave, transaction_id: ${transaction_id}`,
    );
    const verificationResponse = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveConfig.secretKey}`,
        },
      },
    );

    const { data } = verificationResponse;
    console.log(
      "[BACKEND VERIFY] Flutterwave API response:",
      JSON.stringify(data, null, 2),
    );

    if (data.status === "success" && data.data.status === "successful") {
      const transactionDetails = data.data;
      const { tx_ref: flutterwaveTxRef } = transactionDetails;
      console.log(
        `[BACKEND VERIFY] Flutterwave verification successful for tx_ref: ${flutterwaveTxRef}`,
      );

      let transaction = await transactionRepository.findOne({
        where: { reference: flutterwaveTxRef },
        relations: ["user"],
      });

      // If transaction exists and is already successful, do nothing further.
      if (transaction && transaction.status === "success") {
        console.log(
          `[BACKEND VERIFY] Transaction ${flutterwaveTxRef} already processed and successful.`,
        );
        return res.status(200).json({
          message: "Transaction already verified.",
          newBalance: transaction.user.walletBalance,
        });
      }

      // If transaction exists but is not successful, or doesn't exist, proceed.
      if (!transaction) {
        console.log(
          `[BACKEND VERIFY] No existing transaction found for ref: ${flutterwaveTxRef}. Creating a new one.`,
        );
        const { userId } = req.body; // Get userId from the initial request
        const user = await userRepository.findOneBy({ id: userId });
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
        transaction = new Transaction();
        transaction.user = user;
        transaction.reference = flutterwaveTxRef;
        transaction.type = TransactionType.DEPOSIT;
      } else {
        console.log(
          `[BACKEND VERIFY] Found existing transaction in DB with status: ${transaction.status}`,
        );
      }

      // Security check: Verify amount and currency
      if (
        parseFloat(transactionDetails.amount) < transaction.amount ||
        transactionDetails.currency !== "NGN"
      ) {
        transaction.status = "failed";
        transaction.amount = parseFloat(transactionDetails.amount); // Update with actual amount from Flutterwave
        await transactionRepository.save(transaction);
        console.log(
          `[BACKEND VERIFY] Error: Transaction details mismatch or amount discrepancy.`,
        );
        return res
          .status(400)
          .json({ message: "Transaction details mismatch." });
      }

      // Update transaction details
      transaction.status = "success";
      transaction.amount = parseFloat(transactionDetails.amount);

      // Update user's wallet balance
      const user = transaction.user;
      const oldBalance = user.walletBalance;
      user.walletBalance += transaction.amount;

      // Save both entities in a single transaction
      await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.save(transaction);
          await transactionalEntityManager.save(user);
        },
      );

      console.log(
        `[BACKEND VERIFY] User wallet updated. Old: ${oldBalance}, New: ${user.walletBalance}`,
      );

      await sendNotification(
        user.id,
        "Deposit Successful",
        `Your wallet has been credited with ${transaction.amount} NGN. Your new balance is ${user.walletBalance} NGN.`,
      );

      return res.status(200).json({
        message: "Transaction verified and wallet updated successfully.",
        newBalance: user.walletBalance,
      });
    } else {
      console.log(
        `[BACKEND VERIFY] Flutterwave verification failed or payment not successful. Status: ${data.data.status}`,
      );
      const transaction = await transactionRepository.findOne({
        where: { reference: tx_ref as string, status: "pending" },
        relations: ["user"],
      });

      if (transaction) {
        transaction.status = "failed";
        await transactionRepository.save(transaction);
        console.log(
          `[BACKEND VERIFY] Marked transaction ${transaction.reference} as failed.`,
        );
        await sendNotification(
          transaction.user.id,
          "Deposit Failed",
          `Your deposit of ${transaction.amount} NGN failed. Please try again.`,
        );
      }

      return res.status(400).json({
        message: "Transaction verification failed or payment not successful.",
      });
    }
  } catch (error) {
    console.error(
      "[BACKEND VERIFY] CATCH BLOCK: Error verifying Flutterwave transaction:",
      error.response ? error.response.data : error.message,
    );
    return res
      .status(500)
      .json({ message: "Failed to verify transaction.", error: error.message });
  }
};

export const getTransactionsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const transactions = await transactionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Failed to fetch transactions." });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res
      .status(400)
      .json({ message: "Missing required fields: userId or amount." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    // Create and save the new withdrawal transaction
    const transaction = new Transaction();
    transaction.user = user;
    transaction.type = TransactionType.WITHDRAWAL;
    transaction.amount = amount;

    user.walletBalance -= amount;
    await userRepository.save(user);
    await transactionRepository.save(transaction);

    // Send notification for withdrawal
    await sendNotification(
      user.id,
      "Withdrawal Successful",
      `Your wallet has been debited with ${amount}. Your new balance is ${user.walletBalance}.`,
    );

    return res.status(200).json({
      message: "Withdrawal successful.",
      newBalance: user.walletBalance,
    });
  } catch (error) {
    console.error("Error during withdrawal:", error);
    return res.status(500).json({ message: "Failed to process withdrawal." });
  }
};
