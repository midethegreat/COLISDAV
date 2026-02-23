import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { AppDataSource } from "./data-source";
import { setupWebSocket } from "./notificationService";

const app: Express = express();
const port = process.env.PORT || 3000;

import userRoutes from "./routes/userRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import rideRoutes from "./routes/rideRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import adminRoutes from "./routes/adminRoutes"; // Import admin routes
import twoFaRoutes from "./routes/2fa.js";
import bankRoutes from "./routes/bankRoutes";

app.use(cors());
app.use(express.json());

// Mount the routes
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes); // Mount admin routes
app.use("/api/2fa", twoFaRoutes);
app.use("/api/bank", bankRoutes);

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Set up the WebSocket server
setupWebSocket(server);

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    // Start the server
    server.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
