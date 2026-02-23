import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { sendOtpEmail } from "../utils/mailer";
import { sendNotification } from "../notificationService";

const userRepository = AppDataSource.getRepository(User);

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * @desc    Register a new user and send OTP
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  const {
    matricNumber,
    pin,
    idCardImage,
    email,
    fullName,
    department,
    level,
    phoneNumber,
  } = req.body;

  if (!matricNumber || !pin || !email || !fullName) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  try {
    const existingUser = await userRepository.findOne({
      where: [{ matricNumber }, { email }],
    });

    if (existingUser) {
      if (existingUser.isVerified && pin !== "0000") {
        existingUser.pin = pin;
        await userRepository.save(existingUser);
        console.log("PIN set for user:", existingUser.email);
        return res.status(200).json({
          message: "Registration complete. PIN has been set.",
          user: { id: existingUser.id, email: existingUser.email },
        });
      }

      if (!existingUser.isVerified) {
        existingUser.otp = generateOtp();
        existingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        // await sendOtpEmail(existingUser.email, existingUser.otp);
        console.log(
          `****** OTP for ${existingUser.email}: ${existingUser.otp} ******`,
        ); // Temporary: Log OTP
        await userRepository.save(existingUser);
        console.log("OTP resent to unverified user:", existingUser.email);
        return res
          .status(200)
          .json({ message: "Verification code has been resent." });
      }

      return res.status(400).json({ message: "User is already registered." });
    }

    const newUser = new User();
    newUser.matricNumber = matricNumber;
    newUser.pin = pin;
    newUser.idCardImage = idCardImage;
    newUser.email = email;
    newUser.fullName = fullName;
    newUser.department = department;
    newUser.level = level;
    newUser.phoneNumber = phoneNumber;
    newUser.otp = generateOtp();
    newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // await sendOtpEmail(newUser.email, newUser.otp);
    console.log(`****** OTP for ${newUser.email}: ${newUser.otp} ******`); // Temporary: Log OTP
    await userRepository.save(newUser);

    console.log("New user registered, OTP sent:", newUser.matricNumber);
    res.status(201).json({
      message:
        "User registered. Please check your email for the verification code.",
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res
      .status(500)
      .json({ message: "Failed to register user. Please try again." });
  }
};

/**
 * @desc    Verify user's email with OTP
 * @route   POST /api/users/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await userRepository.save(user);

    console.log("User email verified:", user.email);
    res.status(200).json({
      message: "Email verified successfully. You are now logged in.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        matricNumber: user.matricNumber,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/users/resend-otp
 * @access  Public
 */
export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    user.otp = generateOtp();
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await sendOtpEmail(email, user.otp);
    await userRepository.save(user);

    console.log("OTP resent to:", email);
    res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Failed to resend verification email." });
  }
};

/**
 * @desc    Set the user's PIN after email verification
 * @route   POST /api/users/set-pin
 * @access  Public
 */
export const setPin = async (req: Request, res: Response) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return res.status(400).json({ message: "Email and PIN are required." });
  }

  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message: "Email not verified. Please verify your email first.",
        });
    }

    user.pin = pin;
    await userRepository.save(user);

    console.log("PIN successfully set for user:", email);
    return res.status(200).json({ message: "PIN has been set successfully." });
  } catch (error) {
    console.error("Error setting PIN:", error);
    return res.status(500).json({ message: "Failed to set PIN." });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  const { matricNumber, pin } = req.body;

  if (!matricNumber || !pin) {
    return res
      .status(400)
      .json({ message: "Please provide matric number and PIN" });
  }

  try {
    const user = await userRepository.findOneBy({ matricNumber });

    if (user && user.pin === pin) {
      if (!user.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email before logging in." });
      }
      console.log("User logged in successfully:", user.matricNumber);
      res.json({
        message: "Login successful.",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          matricNumber: user.matricNumber,
          walletBalance: user.walletBalance,
          idCardImage: user.idCardImage,
        },
      });
    } else {
      console.log("Login failed for matric number:", matricNumber);
      res.status(401).json({ message: "Invalid matric number or PIN" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

/**
 * @desc    Update user PIN
 * @route   POST /api/users/update-pin
 * @access  Private
 */
export const updatePin = async (req: Request, res: Response) => {
  const { userId, oldPin, newPin } = req.body;

  if (!userId || !oldPin || !newPin) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.pin !== oldPin) {
      return res.status(400).json({ message: "Invalid old PIN." });
    }

    user.pin = newPin;
    await userRepository.save(user);

    // Send notification for PIN change
    await sendNotification(
      user.id,
      "Security Alert",
      "Your PIN has been successfully changed. If you did not authorize this, please contact support immediately.",
    );

    return res.status(200).json({ message: "PIN updated successfully." });
  } catch (error) {
    console.error("Error updating PIN:", error);
    return res.status(500).json({ message: "Failed to update PIN." });
  }
};

/**
 * @desc    Log user out
 * @route   POST /api/users/logout
 * @access  Public
 */
export const logoutUser = (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`User logged out: ${email}`);
  res.status(200).json({ message: "Logged out successfully." });
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/delete
 * @access  Public
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await userRepository.remove(user);
    console.log(`User account deleted: ${email}`);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error during account deletion." });
  }
};
