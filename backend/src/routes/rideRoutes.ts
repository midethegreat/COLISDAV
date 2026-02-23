import { Router } from "express";
import {
  bookRide,
  updateRideStatus,
  getRidesByUser,
  completeRide,
  cancelRide,
  rateAndTipRide,
} from "../controllers/rideController";

const router = Router();

// Route to book a new ride
router.post("/", bookRide);

// Route to update a ride's status (e.g., completed, cancelled)
router.patch("/:rideId/status", updateRideStatus);

// Route to mark a ride as completed
router.patch("/:rideId/complete", completeRide);

// Route to mark a ride as cancelled
router.patch("/:rideId/cancel", cancelRide);

// Route to get all rides for a specific user
router.get("/user/:userId", getRidesByUser);

// Route to rate and tip a ride
router.post("/:rideId/rate", rateAndTipRide);

export default router;
