import { Router } from "express";
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController";

const router = Router();

// Route to get all notifications for a specific user
router.get("/user/:userId", getNotificationsByUser);

// Route to mark a notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// Route to mark all notifications for a user as read
router.patch("/user/:userId/read-all", markAllNotificationsAsRead);

export default router;
