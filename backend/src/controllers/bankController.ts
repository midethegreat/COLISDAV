import { Request, Response } from "express";
import Flutterwave from "flutterwave-node-v3";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { BankAccount, VerificationStatus } from "../entities/BankAccount";
import { flutterwaveConfig } from "../constants/flutterwaveConfig";

const userRepository = AppDataSource.getRepository(User);
const bankAccountRepository = AppDataSource.getRepository(BankAccount);

const flw = new Flutterwave(
  flutterwaveConfig.publicKey,
  flutterwaveConfig.secretKey,
);

export const verifyBankAccount = async (req: Request, res: Response) => {
  const { accountNumber, bankCode } = req.body;

  if (!accountNumber || !bankCode) {
    return res
      .status(400)
      .json({ message: "Account number and bank code are required" });
  }

  try {
    const payload = {
      account_number: accountNumber,
      account_bank: bankCode,
    };
    console.log("Verifying account with payload:", payload); // Enhanced logging
    const response = await flw.Misc.verify_Account(payload);

    if (response.status === "success") {
      res.status(200).json(response.data);
    } else {
      console.error("Flutterwave verification error:", response); // Full error response
      throw new Error(response.message || "Failed to verify bank account.");
    }
  } catch (error) {
    console.error("Bank verification failed:", error);
    res
      .status(500)
      .json({ message: "Bank verification failed", error: error.message });
  }
};

export const addBankAccount = async (req: Request, res: Response) => {
  const { userId, accountNumber, bankCode, accountName } = req.body;

  if (!userId || !accountNumber || !bankCode || !accountName) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the bank account is already linked to this user
    const existingAccount = await bankAccountRepository.findOne({
      where: { user: { id: userId }, accountNumber, bankCode },
    });

    if (existingAccount) {
      return res
        .status(409)
        .json({ message: "This bank account is already linked." });
    }

    const newAccount = new BankAccount();
    newAccount.user = user;
    newAccount.accountNumber = accountNumber;
    newAccount.bankCode = bankCode;
    newAccount.accountName = accountName;
    newAccount.status = VerificationStatus.PENDING; // Default to pending

    await bankAccountRepository.save(newAccount);

    res.status(201).json({
      message: "Bank account added successfully.",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error adding bank account:", error);
    res.status(500).json({ message: "Failed to add bank account." });
  }
};

export const getBankAccounts = async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const accounts = await bankAccountRepository.find({
      where: { user: { id: userId } },
    });

    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching bank accounts for user:", userId, error);
    res.status(500).json({
      message: "Server error while fetching bank accounts.",
      error: error.message,
    });
  }
};

export const deleteBankAccount = async (req: Request, res: Response) => {
  const { accountId } = req.params;

  if (!accountId) {
    return res.status(400).json({ message: "Account ID is required." });
  }

  try {
    const account = await bankAccountRepository.findOneBy({ id: accountId });

    if (!account) {
      return res.status(404).json({ message: "Bank account not found." });
    }

    await bankAccountRepository.remove(account);

    res.status(200).json({ message: "Bank account deleted successfully." });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({ message: "Server error during account deletion." });
  }
};

export const getFlutterwaveBankList = async (req: Request, res: Response) => {
  try {
    const payload = {
      country: "NG", // Or any other country code you need
    };
    const response = await flw.Bank.country(payload);
    if (response.status === "success") {
      // Sort the banks alphabetically by name
      const sortedBanks = response.data.sort((a: any, b: any) =>
        a.name.localeCompare(b.name),
      );
      res.status(200).json(sortedBanks);
    } else {
      throw new Error("Failed to fetch bank list from Flutterwave.");
    }
  } catch (error) {
    console.error("Error fetching Flutterwave bank list:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bank list.", error: error.message });
  }
};
