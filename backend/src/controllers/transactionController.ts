import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Transaction, TransactionType } from "../entities/Transaction";
import { User } from "../entities/User";
import { sendNotification } from "../notificationService";
import Flutterwave from "flutterwave-node-v3";
import { flutterwaveConfig } from "../constants/flutterwaveConfig";

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

const flw = new Flutterwave(
  flutterwaveConfig.publicKey,
  flutterwaveConfig.secretKey,
);

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
      redirect_url: "https://your-app.com/payment-callback", // IMPORTANT: Update this URL to your actual callback URL
      customer: {
        email,
        phonenumber: phoneNumber,
        name: fullName,
      },
      customizations: {
        title: "CampusRide Wallet Deposit",
        description: "Fund your CampusRide wallet",
        logo: "https://your-app.com/logo.png", // IMPORTANT: Update with your actual logo URL
      },
    };

    const response = await flw.Payment.init(payload);

    if (response.status === "success") {
      // Create a pending transaction record
      const newTransaction = new Transaction();
      newTransaction.user = user;
      newTransaction.amount = parseFloat(amount);
      newTransaction.type = TransactionType.DEPOSIT;
      newTransaction.reference = transactionRef;
      newTransaction.status = "pending"; // Mark as pending initially
      await transactionRepository.save(newTransaction);

      res.status(200).json({ link: response.data.link });
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
  const { transaction_id } = req.query; // Flutterwave sends transaction_id in query params for GET requests

  if (!transaction_id) {
    // If it's a POST request (webhook), transaction_id might be in the body
    // For now, we'll assume it's a redirect from the user's browser
    return res.status(400).json({ message: "Transaction ID is required." });
  }

  try {
    // Verify the transaction with Flutterwave
    const response = await flw.Transaction.verify({
      id: transaction_id as string,
    });

    if (
      response.status === "success" &&
      response.data.status === "successful"
    ) {
      const transactionRef = response.data.tx_ref;
      const amount = response.data.amount;

      // Find the pending transaction in our database
      const transaction = await transactionRepository.findOne({
        where: { reference: transactionRef, status: "pending" },
        relations: ["user"],
      });

      if (transaction) {
        // Update transaction status
        transaction.status = "success";
        await transactionRepository.save(transaction);

        // Update user's wallet balance
        const user = transaction.user;
        user.walletBalance += amount;
        await userRepository.save(user);

        // Send notification
        await sendNotification(
          user.id,
          "Deposit Successful",
          `Your wallet has been credited with ${amount} NGN. Your new balance is ${user.walletBalance} NGN.`,
        );

        return res
          .status(200)
          .json({
            message: "Transaction verified and wallet updated successfully.",
          });
      } else {
        // Transaction not found or already processed
        console.warn(
          `Transaction with reference ${transactionRef} not found or already processed.`,
        );
        return res
          .status(404)
          .json({ message: "Transaction not found or already processed." });
      }
    } else {
      // Payment was not successful or verification failed
      console.error("Flutterwave transaction verification failed:", response);
      // Optionally, update transaction status to 'failed' if found
      const transactionRef = response.data?.tx_ref;
      if (transactionRef) {
        const transaction = await transactionRepository.findOne({
          where: { reference: transactionRef, status: "pending" },
        });
        if (transaction) {
          transaction.status = "failed";
          await transactionRepository.save(transaction);
          await sendNotification(
            transaction.user.id,
            "Deposit Failed",
            `Your deposit of ${transaction.amount} NGN failed. Please try again.`,
          );
        }
      }
      return res
        .status(400)
        .json({
          message: "Transaction verification failed or payment not successful.",
        });
    }
  } catch (error) {
    console.error("Error verifying Flutterwave transaction:", error);
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
