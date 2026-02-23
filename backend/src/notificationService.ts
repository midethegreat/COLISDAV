import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { AppDataSource } from "./data-source";
import { Notification } from "./entities/Notification";
import { User } from "./entities/User";

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);
const clients = new Map<string, WebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      console.log("WebSocket connection rejected: No userId provided.");
      ws.close(1008, "User ID is required");
      return;
    }

    clients.set(userId, ws);
    console.log(`WebSocket client connected: ${userId}`);

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`WebSocket client disconnected: ${userId}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });

    ws.on("pong", () => {
      // This is a heartbeat response from the client.
      // You can add logic here to track client liveness.
    });
  });

  // Set up a heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      // The 'ws' object from 'wss.clients' is a generic WebSocket,
      // so we need to find the associated userId from our 'clients' map.
      let userId: string | null = null;
      for (const [id, clientWs] of clients.entries()) {
        if (clientWs === ws) {
          userId = id;
          break;
        }
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.ping((err) => {
          if (err) {
            console.error(`Ping error for user ${userId}:`, err);
            // If ping fails, you might want to terminate the connection.
            clients.delete(userId!);
            ws.terminate();
          }
        });
      }
    });
  }, 30000); // Ping every 30 seconds

  wss.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket server shutting down.");
  });
}

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
) {
  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      console.error(`Cannot send notification to non-existent user ${userId}`);
      return;
    }

    const notification = new Notification();
    notification.user = user;
    notification.title = title;
    notification.message = message;
    await notificationRepository.save(notification);
    console.log(`Notification saved to DB for user ${userId}`);

    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(notification);
      client.send(payload);
      console.log(
        `SUCCESS: Real-time notification sent to user ${userId}. Payload: ${payload}`,
      );
    } else {
      console.log(
        `INFO: User ${userId} is not connected. Notification saved to DB.`,
      );
    }
  } catch (error) {
    console.error(
      `Failed to send or save notification for user ${userId}:`,
      error,
    );
  }
}

export async function broadcastNotification(title: string, message: string) {
  try {
    const allUsers = await userRepository.find();
    const notifications: Notification[] = [];

    for (const user of allUsers) {
      const notification = new Notification();
      notification.user = user;
      notification.title = title;
      notification.message = message;
      notifications.push(notification);
    }

    await notificationRepository.save(notifications);
    console.log(
      `Broadcast notification saved to DB for ${allUsers.length} users.`,
    );

    for (const notification of notifications) {
      const client = clients.get(notification.user.id);
      if (client && client.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify(notification);
        client.send(payload);
        console.log(
          `SUCCESS: Broadcast notification sent to user ${notification.user.id}.`,
        );
      }
    }
  } catch (error) {
    console.error("Failed to broadcast notification:", error);
  }
}
