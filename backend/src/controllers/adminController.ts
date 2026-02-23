import { Request, Response } from "express";
import { broadcastNotification } from "../notificationService";

export const handleBroadcast = async (req: Request, res: Response) => {
  const { title, message, secret } = req.body;

  // IMPORTANT: In a real application, this should be a more secure check,
  // for example, by verifying a JWT from an authenticated admin user.
  if (secret !== "YOUR_SUPER_SECRET") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required." });
  }

  try {
    await broadcastNotification(title, message);
    return res.status(200).json({ message: "Broadcast sent successfully." });
  } catch (error) {
    console.error("Error handling broadcast:", error);
    return res.status(500).json({ message: "Failed to send broadcast." });
  }
};
