import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthProvider";
import { Alert } from "react-native";
import API_BASE_URL from "../constants/apiConfig";

const API_URL = API_BASE_URL;
// Construct WebSocket URL from the base API URL
const WEBSOCKET_URL = API_BASE_URL.replace("http", "ws").replace("/api", "");

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Fetch historical notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/notifications/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        console.log(`Fetched ${data.length} notifications for user ${user.id}`);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `${API_URL}/notifications/user/${user.id}/read-all`,
        {
          method: "PATCH",
        },
      );
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } else {
        console.error("Failed to mark all notifications as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // 1. Fetch initial notifications
      fetchNotifications();

      // 2. Connect to WebSocket for real-time updates
      const ws = new WebSocket(`${WEBSOCKET_URL}?userId=${user.id}`);

      ws.onopen = () => {
        console.log("WebSocket connected for notifications");
      };

      ws.onmessage = (event) => {
        try {
          const newNotification = JSON.parse(event.data);
          // Add new notification to the top of the list
          setNotifications((prev) => [
            {
              ...newNotification,
              isRead: false, // Ensure new notifications are marked as unread
            },
            ...prev,
          ]);
          // Optionally, show an in-app alert
          Alert.alert(newNotification.title, newNotification.message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (e) => {
        // The 'e' object for onerror is typically a generic Event.
        console.error("WebSocket error observed:", e.message);
      };

      ws.onclose = (e) => {
        // The 'e' object for onclose is a CloseEvent.
        console.log(
          "WebSocket connection closed.",
          `Code: ${e.code}`,
          `Reason: ${e.reason}`,
        );
      };

      return () => {
        console.log("Closing WebSocket connection.");
        ws.close();
      };
    }
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, fetchNotifications, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
