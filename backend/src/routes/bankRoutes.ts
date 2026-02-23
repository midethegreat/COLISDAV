import { Router } from "express";
import {
  verifyBankAccount,
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  getFlutterwaveBankList,
} from "../controllers/bankController";

const router = Router();

router.get("/list", getFlutterwaveBankList);
router.post("/verify", verifyBankAccount);
router.post("/add", addBankAccount);
router.get("/:userId", getBankAccounts);
router.delete("/:accountId", deleteBankAccount);

export default router;
