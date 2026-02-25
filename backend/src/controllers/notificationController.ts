import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";

const notificationRepository = AppDataSource.getRepository(Notification);

// Get all notifications for a specific user
export const getNotificationsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const notifications = await notificationRepository.find({
      where: { user: { id: userId as any } },
      order: { createdAt: "DESC" }, // Show newest first
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// Mark a specific notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationRepository.findOneBy({
      id: notificationId as any,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.isRead = true;
    await notificationRepository.save(notification);

    console.log(`Notification ${notificationId} marked as read.`);
    return res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notification as read." });
  }
};

// Mark all notifications for a user as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
) => {
  const { userId } = req.params;

  try {
    // Efficiently update all unread notifications for the user to be read
    await notificationRepository.update(
      { user: { id: userId as any }, isRead: false },
      { isRead: true },
    );

    console.log(`All notifications for user ${userId} marked as read.`);
    return res
      .status(200)
      .json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark all notifications as read." });
  }
};
