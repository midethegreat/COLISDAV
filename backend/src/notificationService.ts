import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { parse } from "url";
import { IncomingMessage } from "http";
import { Duplex } from "stream";

const clients = new Map<string, WebSocket>();

export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on(
    "upgrade",
    (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      console.log("Upgrade request received for URL:", request.url);
      const { pathname, query } = parse(request.url!, true);
      console.log("Parsed pathname:", pathname);

      if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          const userId = query.userId as string;
          if (!userId) {
            ws.close(1008, "User ID is required");
            return;
          }

          clients.set(userId, ws);
          console.log(`Client connected: ${userId}`);

          ws.on("close", () => {
            clients.delete(userId);
            console.log(`Client disconnected: ${userId}`);
          });

          ws.on("message", (message) => {
            console.log(`Received message from ${userId}: ${message}`);
          });

          ws.on("error", (error) => {
            console.error(`WebSocket error for user ${userId}:`, error);
          });
        });
      } else {
        socket.destroy();
      }
    },
  );

  // Heartbeat to keep connections alive
  setInterval(() => {
    clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clients.delete(userId);
        console.log(`Client connection closed, removed: ${userId}`);
      }
    });
  }, 30000);

  console.log("WebSocket server initialized");
}

export function sendNotification(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    console.log(`Sent notification to ${userId}`);
  } else {
    console.log(`Client not found or connection not open for user ${userId}`);
  }
}

export function broadcastNotification(message: any) {
  const messageString = JSON.stringify(message);
  clients.forEach((client, userId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
      console.log(`Broadcasted notification to ${userId}`);
    }
  });
}
