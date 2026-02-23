import express from "express";
import {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  logoutUser,
  deleteUser,
  updatePin,
  setPin,
} from "../controllers/userController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/set-pin", setPin);
router.delete("/delete", deleteUser);
router.patch("/update-pin", updatePin);

export default router;
