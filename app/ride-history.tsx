import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Menu,
  Calendar,
  MapPin,
  CreditCard,
  ChevronRight,
  Bell,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { MOCK_RIDES } from "../mocks/data";
import DrawerMenu from "../components/DrawerMenu";
import Header from "../components/Header";

export default function RideHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  const getStatusColor = (status: string) => {
    if (status === "completed") return Colors.green;
    if (status === "cancelled") return Colors.red;
    return Colors.accent;
  };

  const getStatusBg = (status: string) => {
    if (status === "completed") return Colors.greenLight;
    if (status === "cancelled") return Colors.redLight;
    return Colors.accentLight;
  };

  const handleCompleteRide = (rideId: string) => {
    // This is a mock function for testing purposes as we are using mock data.
    // In a real app, this would make an API call to update the ride status
    // and then refresh the data.
    Alert.alert(
      "Ride Completed",
      `Ride with ID ${rideId} has been marked as completed.`,
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Ride History"
        subtitle="YOUR RECENT CAMPUS TRIPS"
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_RIDES.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.cardTop}>
              <View style={styles.dateRow}>
                <Calendar size={14} color={Colors.gray} />
                <Text style={styles.dateText}>{ride.date}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBg(ride.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(ride.status) },
                  ]}
                >
                  {ride.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeItem}>
                <View style={styles.pickupDot} />
                <Text style={styles.routeText}>{ride.pickupLocation}</Text>
              </View>
              <View style={styles.routeItem}>
                <View style={styles.destDot} />
                <Text style={styles.routeText}>{ride.destination}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.fareRow}>
                <CreditCard size={14} color={Colors.gray} />
                <Text style={styles.fareText}>₦{ride.fare}</Text>
              </View>
              {ride.status !== "completed" && ride.status !== "cancelled" && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => handleCompleteRide(ride.id)}
                >
                  <Text style={styles.completeBtnText}>COMPLETE RIDE</Text>
                </TouchableOpacity>
              )}
              {ride.status === "completed" && (
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/receipt" as never,
                      params: {
                        txId: ride.txId,
                        fare: ride.fare.toString(),
                        pickup: ride.pickupLocation,
                        destination: ride.destination,
                        date: ride.date,
                        status: ride.status,
                      },
                    });
                  }}
                >
                  <Text style={styles.receiptText}>RECEIPT</Text>
                  <ChevronRight size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  rideCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  routeSection: {
    gap: 10,
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  destDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fareText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  receiptText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  completeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
