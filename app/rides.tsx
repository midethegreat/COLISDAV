import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  SlidersHorizontal,
  Star,
  ShieldCheck,
  Users,
  Zap,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { MOCK_DRIVERS } from "../mocks/data";
import { Driver } from "../types";
import DrawerMenu from "../components/DrawerMenu";
import { Bell } from "lucide-react-native";
import Header from "../components/Header";

type SortType = "nearest" | "seats" | "fare";
type TricycleFilter = "all" | "yellow" | "green";

export default function RidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState<SortType>("nearest");
  const [minSeats, setMinSeats] = useState(1);
  const [tricycleFilter, setTricycleFilter] = useState<TricycleFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const filteredDrivers = useMemo(() => {
    return MOCK_DRIVERS.filter((driver) => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = driver.name.toLowerCase().includes(searchLower);
      const plateMatch = driver.plateNumber.toLowerCase().includes(searchLower);
      const seatsMatch = driver.totalSeats - driver.occupiedSeats >= minSeats;
      const typeMatch =
        tricycleFilter === "all" || driver.tricycleType === tricycleFilter;

      return (nameMatch || plateMatch) && seatsMatch && typeMatch;
    }).sort((a, b) => {
      if (sort === "nearest") return a.distance - b.distance;
      if (sort === "seats")
        return (
          b.totalSeats - b.occupiedSeats - (a.totalSeats - a.occupiedSeats)
        );
      if (sort === "fare") return a.fare - b.fare;
      return 0;
    });
  }, [searchQuery, sort, minSeats, tricycleFilter]);

  const seatsLeft = (driver: Driver) =>
    driver.totalSeats - driver.occupiedSeats;
  const occupiedRatio = (driver: Driver) =>
    driver.occupiedSeats / driver.totalSeats;

  const getKekeColor = (type: "yellow" | "green") => {
    return type === "yellow" ? Colors.accent : Colors.primary;
  };

  const handleBook = (driver: Driver) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/booking-confirm" as never,
      params: {
        pickup: "Senate Building",
        destination: "Library Junction",
        fare: driver.fare.toString(),
        passengers: "1",
        paymentMethod: "Wallet",
        voucher: "",
        driverName: driver.name,
        driverId: driver.id,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Available Rides"
        subtitle="LIVE AVAILABILITY ACROSS THE CAMPUS"
        onMenuPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setDrawerOpen(true);
        }}
        onNotificationPress={() => router.push("/notifications" as never)}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={Colors.lightGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find pilot or plate..."
            placeholderTextColor={Colors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilter(true)}
        >
          <SlidersHorizontal size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDrivers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your filters or search
            </Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => (
            <View key={driver.id} style={styles.driverCard}>
              <View style={styles.cardTop}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>AVAILABLE</Text>
                </View>
                <View style={styles.kekeTypeBadge}>
                  <View
                    style={[
                      styles.kekeColorDot,
                      { backgroundColor: getKekeColor(driver.tricycleType) },
                    ]}
                  />
                  <Text style={styles.kekeTypeText}>
                    {driver.tricycleType.toUpperCase()} KEKE
                  </Text>
                </View>
                {driver.verified && (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={12} color={Colors.primary} />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                )}
              </View>

              <View style={styles.driverRow}>
                <View style={styles.driverImageWrap}>
                  <Image
                    source={{ uri: driver.image }}
                    style={styles.driverImage}
                  />
                  {driver.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <View style={styles.driverMeta}>
                    <Text style={styles.plateNumber}>{driver.plateNumber}</Text>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{driver.rating}</Text>
                  </View>
                </View>
                <View style={styles.fareWrap}>
                  <Text style={styles.fareAmount}>₦{driver.fare}</Text>
                  <Text style={styles.fareCurrency}>NAIRA</Text>
                </View>
              </View>

              <View style={styles.seatsRow}>
                <View style={styles.seatsInfo}>
                  <Users size={14} color={Colors.gray} />
                  <Text style={styles.seatsText}>
                    {driver.occupiedSeats} / {driver.totalSeats} OCCUPIED
                  </Text>
                </View>
                <Text style={styles.seatsLeft}>
                  {seatsLeft(driver)} SEATS LEFT
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${occupiedRatio(driver) * 100}%` },
                  ]}
                />
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceLabel}>DISTANCE</Text>
                  <Text style={styles.distanceValue}>{driver.distance}m</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookPilotBtn}
                  onPress={() => handleBook(driver)}
                  activeOpacity={0.85}
                >
                  <Zap size={16} color={Colors.white} />
                  <Text style={styles.bookPilotText}>BOOK PILOT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.filterOverlay}>
          <View
            style={[styles.filterSheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Rides</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowFilter(false)}
              >
                <X size={20} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSection}>SORT BY</Text>
            <View style={styles.chipRow}>
              {(["nearest", "seats", "fare"] as SortType[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, sort === s && styles.chipActive]}
                  onPress={() => setSort(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sort === s && styles.chipTextActive,
                    ]}
                  >
                    {s === "nearest"
                      ? "NEAREST"
                      : s === "seats"
                        ? "MORE SEATS"
                        : "LOWEST FARE"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSection}>MINIMUM SEATS AVAILABLE</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 4].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.seatChip, minSeats === n && styles.chipActive]}
                  onPress={() => setMinSeats(n)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      minSeats === n && styles.chipTextActive,
                    ]}
                  >
                    {n}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSection}>KEKE TYPE</Text>
            <View style={styles.chipRow}>
              {(["all", "yellow", "green"] as TricycleFilter[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    tricycleFilter === t && styles.chipActive,
                  ]}
                  onPress={() => setTricycleFilter(t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      tricycleFilter === t && styles.chipTextActive,
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 6,
  },
  driverCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  statusBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  kekeTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  kekeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kekeTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.darkGray,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  driverImageWrap: {
    position: "relative",
  },
  driverImage: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark,
  },
  driverMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  plateNumber: {
    fontSize: 12,
    color: Colors.gray,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.darkGray,
  },
  fareWrap: {
    alignItems: "flex-end",
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.dark,
  },
  fareCurrency: {
    fontSize: 10,
    color: Colors.lightGray,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  seatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  seatsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 0.3,
  },
  seatsLeft: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dark,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distanceBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  distanceLabel: {
    fontSize: 9,
    color: Colors.lightGray,
    letterSpacing: 0.5,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark,
  },
  bookPilotBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  bookPilotText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark,
  },
  closeBtn: {
    padding: 8,
  },
  filterSection: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  seatChip: {
    width: 50,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark,
  },
  chipTextActive: {
    color: Colors.white,
  },
});
