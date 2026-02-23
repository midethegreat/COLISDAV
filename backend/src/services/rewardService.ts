import { AppDataSource } from "../data-source";
import { User, RewardTier } from "../entities/User";

const userRepository = AppDataSource.getRepository(User);

export const checkAndApplyRewardTier = async (user: User) => {
  let newTier: RewardTier | null = null;

  if (user.rideCount >= 20) {
    newTier = RewardTier.PLATINUM;
  } else if (user.rideCount >= 10) {
    newTier = RewardTier.GOLD;
  } else if (user.rideCount >= 5) {
    newTier = RewardTier.SILVER;
  }

  if (newTier && newTier !== user.rewardTier) {
    user.rewardTier = newTier;
    await userRepository.save(user);
    console.log(`User ${user.email} promoted to ${newTier} tier.`);
  }
};
