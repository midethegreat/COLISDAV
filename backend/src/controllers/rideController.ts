import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Ride, RideStatus } from "../entities/Ride";
import { User } from "../entities/User";
import { Transaction, TransactionType } from "../entities/Transaction";
import { sendNotification } from "../notificationService";
import { checkAndApplyRewardTier } from "../services/rewardService";

const rideRepository = AppDataSource.getRepository(Ride);
const userRepository = AppDataSource.getRepository(User);
const transactionRepository = AppDataSource.getRepository(Transaction);

// Book a new ride
export const bookRide = async (req: Request, res: Response) => {
  const { userId, origin, destination, fare } = req.body;

  if (!userId || !origin || !destination || !fare) {
    return res.status(400).json({
      message: "Missing required fields: userId, origin, destination, or fare.",
    });
  }

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.walletBalance < fare) {
      return res
        .status(400)
        .json({ message: "Insufficient wallet balance to book this ride." });
    }

    const ride = new Ride();
    ride.user = user;
    ride.origin = origin;
    ride.destination = destination;
    ride.fare = fare;
    // This is the new line that generates the code
    ride.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // Status defaults to BOOKED

    await rideRepository.save(ride);

    console.log(
      `Ride booked for user ${user.email} from ${origin} to ${destination}`,
    );
    return res.status(201).json({ message: "Ride booked successfully.", ride });
  } catch (error) {
    console.error("Error booking ride:", error);
    return res.status(500).json({ message: "Failed to book ride." });
  }
};

// Update a ride's status (e.g., to completed or cancelled)
export const updateRideStatus = async (req: Request, res: Response) => {
  const { rideId } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(RideStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid or missing status." });
  }

  try {
    const ride = await rideRepository.findOne({
      where: { id: rideId as any },
      relations: ["user"],
    });
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    // If the ride is completed, process the payment from the user's wallet
    if (
      status === RideStatus.COMPLETED &&
      ride.status !== RideStatus.COMPLETED
    ) {
      const user = ride.user;
      if (user.walletBalance < ride.fare) {
        return res
          .status(400)
          .json({ message: "Insufficient balance to complete payment." });
      }

      // Deduct fare from wallet
      user.walletBalance -= ride.fare;
      await userRepository.save(user);

      // Create a corresponding payment transaction
      const transaction = new Transaction();
      transaction.user = user;
      transaction.type = TransactionType.PAYMENT;
      transaction.amount = ride.fare;
      await transactionRepository.save(transaction);

      console.log(
        `Payment processed for ride ${ride.id}. New balance for ${user.email}: ${user.walletBalance}`,
      );

      // Send a real-time notification to the user
      console.log(
        `Attempting to send 'Ride Completed' notification to user ${user.id}`,
      );
      // ... inside the if (status === RideStatus.COMPLETED ... ) block
      await sendNotification(
        user.id,
        "Ride Completed!",
        `Your ride from ${ride.origin} to ${ride.destination} is complete. A fare of ${ride.fare.toFixed(2)} has been deducted.`,
      );

      // Increment ride count and check for rewards
      user.rideCount += 1;
      await userRepository.save(user);
      await checkAndApplyRewardTier(user);
    } else if (
      status === RideStatus.CANCELLED &&
      ride.status !== RideStatus.CANCELLED
    ) {
      const user = ride.user;
      // Optional: Refund the user if a fare was held or pre-authorized
      console.log(`Ride ${ride.id} was cancelled by user ${user.id}.`);

      // Send a real-time notification to the user
      console.log(
        `Attempting to send 'Ride Cancelled' notification to user ${user.id}`,
      );
      await sendNotification(
        user.id,
        "Ride Cancelled",
        `Your ride from ${ride.origin} to ${ride.destination} has been cancelled.`,
      );
    }

    ride.status = status;
    await rideRepository.save(ride);

    console.log(`Ride ${ride.id} status updated to ${status}`);
    return res
      .status(200)
      .json({ message: `Ride status updated to ${status}.`, ride });
  } catch (error) {
    console.error("Error updating ride status:", error);
    return res.status(500).json({ message: "Failed to update ride status." });
  }
};

// Get all rides for a specific user
export const getRidesByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const rides = await rideRepository.find({
      where: { user: { id: userId as any } },
    });

    console.log(`Fetched ride history for user ${userId}`);
    return res.status(200).json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    return res.status(500).json({ message: "Failed to fetch rides." });
  }
};

export const completeRide = async (req: Request, res: Response) => {
  req.body.status = RideStatus.COMPLETED;
  return updateRideStatus(req, res);
};

export const cancelRide = async (req: Request, res: Response) => {
  req.body.status = RideStatus.CANCELLED;
  return updateRideStatus(req, res);
};

// Rate and Tip a ride
export const rateAndTipRide = async (req: Request, res: Response) => {
  const { rideId } = req.params;
  const { rating, tip } = req.body;

  if (!rating) {
    return res.status(400).json({ message: "Rating is required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const ride = await rideRepository.findOneBy({ id: rideId as any });
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    ride.rating = rating;
    if (tip) {
      ride.tip = tip;
    }

    await rideRepository.save(ride);

    return res.status(200).json({ message: "Ride rated successfully.", ride });
  } catch (error) {
    console.error("Error rating ride:", error);
    return res.status(500).json({ message: "Failed to rate ride." });
  }
};
