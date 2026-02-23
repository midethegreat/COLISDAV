import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Menu,
  Gift,
  Star,
  Zap,
  Ticket,
  Clock,
  Trophy,
  ChevronRight,
  Bell,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import DrawerMenu from "../components/DrawerMenu";
import { MOCK_VOUCHERS } from "../mocks/data";

const REWARD_TIERS = [
  {
    name: "Bronze",
    minRides: 0,
    maxRides: 10,
    color: "#CD7F32",
    perks: ["5% ride discount", "Priority support"],
  },
  {
    name: "Silver",
    minRides: 10,
    maxRides: 25,
    color: "#9CA3AF",
    perks: ["10% ride discount", "Free voucher monthly", "Priority matching"],
  },
  {
    name: "Gold",
    minRides: 25,
    maxRides: 50,
    color: "#F59E0B",
    perks: [
      "15% ride discount",
      "Two free vouchers monthly",
      "VIP support",
      "Early access to features",
    ],
  },
  {
    name: "Platinum",
    minRides: 50,
    maxRides: 100,
    color: "#8B5CF6",
    perks: [
      "20% ride discount",
      "Unlimited vouchers",
      "Dedicated agent",
      "Free rides weekly",
    ],
  },
];

export const checkAndApplyRewardTier = async (user: User) => {
  const userRepository = getRepository(User);

  // Find the highest tier the user qualifies for
  const newTier = REWARD_TIERS.slice()
    .reverse()
    .find((tier) => user.rideCount >= tier.minRides);

  if (newTier && newTier.name !== user.rewardTier) {
    user.rewardTier = newTier.name;
    await userRepository.save(user);

    await sendNotification(
      user.id,
      `Congratulations! You've reached the ${newTier.name} tier!`,
      `You now have access to new perks: ${newTier.perks.join(", ")}.`,
    );
  }
};

const CHALLENGES = [
  {
    id: "1",
    title: "First Timer",
    desc: "Complete your first ride",
    reward: "₦50 voucher",
    progress: 1,
    total: 1,
    completed: true,
  },
  {
    id: "2",
    title: "Weekly Warrior",
    desc: "Complete 5 rides this week",
    reward: "₦100 voucher",
    progress: 3,
    total: 5,
    completed: false,
  },
  {
    id: "3",
    title: "Eco Rider",
    desc: "Use green keke 10 times",
    reward: "₦200 voucher",
    progress: 4,
    total: 10,
    completed: false,
  },
  {
    id: "4",
    title: "Campus Explorer",
    desc: "Visit 8 different locations",
    reward: "Free ride",
    progress: 5,
    total: 8,
    completed: false,
  },
  {
    id: "5",
    title: "Refer a Friend",
    desc: "Invite 3 friends to join CID",
    reward: "₦500 voucher",
    progress: 1,
    total: 3,
    completed: false,
  },
];

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalRides = 12;
  const currentTier =
    REWARD_TIERS.find(
      (t) => totalRides >= t.minRides && totalRides < t.maxRides,
    ) ?? REWARD_TIERS[0];
  const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(currentTier) + 1];
  const tierProgress = nextTier
    ? (totalRides - currentTier.minRides) /
      (nextTier.minRides - currentTier.minRides)
    : 1;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: tierProgress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerOpen(true)}
        >
          <Menu size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Rewards Hub</Text>
          <Text style={styles.headerSub}>EARN WHILE YOU RIDE</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notifications" as never)}
          style={styles.notificationButton}
        >
          <Bell size={24} color={Colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tierCard, { borderColor: currentTier.color }]}>
          <View style={styles.tierTop}>
            <View
              style={[styles.tierBadge, { backgroundColor: currentTier.color }]}
            >
              <Trophy size={18} color={Colors.white} />
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{currentTier.name} Member</Text>
              <Text style={styles.tierRides}>{totalRides} rides completed</Text>
            </View>
            <View style={styles.tierStars}>
              {REWARD_TIERS.map((t, i) => (
                <Star
                  key={i}
                  size={16}
                  color={
                    REWARD_TIERS.indexOf(currentTier) >= i
                      ? currentTier.color
                      : Colors.border
                  }
                  fill={
                    REWARD_TIERS.indexOf(currentTier) >= i
                      ? currentTier.color
                      : "transparent"
                  }
                />
              ))}
            </View>
          </View>

          {nextTier && (
            <View style={styles.tierProgress}>
              <View style={styles.tierProgressBar}>
                <Animated.View
                  style={[
                    styles.tierProgressFill,
                    {
                      backgroundColor: currentTier.color,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.tierProgressText}>
                {nextTier.minRides - totalRides} rides to {nextTier.name}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>YOUR PERKS</Text>
        <View style={styles.perksCard}>
          {currentTier.perks.map((perk, i) => (
            <View
              key={i}
              style={[
                styles.perkItem,
                i < currentTier.perks.length - 1 && styles.perkItemBorder,
              ]}
            >
              <Zap size={14} color={Colors.primary} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ACTIVE VOUCHERS</Text>
        <View style={styles.voucherList}>
          {MOCK_VOUCHERS.map((v) => (
            <View key={v.id} style={styles.voucherCard}>
              <View style={styles.voucherLeft}>
                <View style={styles.voucherIcon}>
                  <Ticket size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.voucherCode}>{v.code}</Text>
                  <Text style={styles.voucherDesc}>{v.description}</Text>
                </View>
              </View>
              <View style={styles.voucherRight}>
                <Text style={styles.voucherDiscount}>-₦{v.discount}</Text>
                <View style={styles.voucherExpiry}>
                  <Clock size={10} color={Colors.lightGray} />
                  <Text style={styles.voucherExpiryText}>{v.expiresAt}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>CHALLENGES</Text>
        {CHALLENGES.map((challenge) => (
          <View
            key={challenge.id}
            style={[
              styles.challengeCard,
              challenge.completed && styles.challengeCompleted,
            ]}
          >
            <View style={styles.challengeTop}>
              <View style={styles.challengeInfo}>
                <Text
                  style={[
                    styles.challengeTitle,
                    challenge.completed && styles.challengeTitleDone,
                  ]}
                >
                  {challenge.title}
                </Text>
                <Text style={styles.challengeDesc}>{challenge.desc}</Text>
              </View>
              <View
                style={[
                  styles.rewardBadge,
                  challenge.completed && styles.rewardBadgeDone,
                ]}
              >
                <Gift
                  size={12}
                  color={challenge.completed ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.rewardBadgeText,
                    challenge.completed && styles.rewardBadgeTextDone,
                  ]}
                >
                  {challenge.reward}
                </Text>
              </View>
            </View>
            <View style={styles.challengeProgressBar}>
              <View
                style={[
                  styles.challengeProgressFill,
                  {
                    width: `${(challenge.progress / challenge.total) * 100}%`,
                    backgroundColor: challenge.completed
                      ? Colors.green
                      : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.challengeProgressText}>
              {challenge.completed
                ? "Completed!"
                : `${challenge.progress}/${challenge.total}`}
            </Text>
          </View>
        ))}
      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.gray,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tierCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tierTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  tierBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  tierRides: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  tierStars: {
    flexDirection: "row",
    gap: 4,
  },
  tierProgress: {
    gap: 6,
  },
  tierProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  tierProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  tierProgressText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.gray,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 12,
  },
  perksCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  perkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  perkText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  voucherList: {
    gap: 10,
    marginBottom: 24,
  },
  voucherCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  voucherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  voucherIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  voucherDesc: {
    fontSize: 11,
    color: Colors.gray,
    marginTop: 2,
  },
  voucherRight: {
    alignItems: "flex-end",
  },
  voucherDiscount: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  voucherExpiry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  voucherExpiryText: {
    fontSize: 10,
    color: Colors.lightGray,
  },
  challengeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  challengeCompleted: {
    borderWidth: 1,
    borderColor: Colors.green,
    backgroundColor: "#F0FFF4",
  },
  challengeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  challengeTitleDone: {
    color: Colors.green,
  },
  challengeDesc: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rewardBadgeDone: {
    backgroundColor: Colors.green,
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  rewardBadgeTextDone: {
    color: Colors.white,
  },
  challengeProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  challengeProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  challengeProgressText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.gray,
  },
});
