import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Zap,
  Clock,
  Check,
  ShieldCheck,
  Phone,
  MessageSquare,
  Navigation,
  Wallet,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import API_URL from "../constants/apiConfig";
import { CAMPUS_LOCATIONS, CAMPUS_CENTER } from "../constants/campus";

let MapView: any;
let Marker: any;
let Polyline: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

type BookingState =
  | "confirm"
  | "searching"
  | "matched"
  | "verifying"
  | "enroute"
  | "processing-payment"
  | "completed";

export default function BookingConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickup: string;
    destination: string;
    fare: string;
    passengers: string;
    paymentMethod: string;
    voucher: string;
    driverName?: string;
  }>();
  const { user } = useAuth();
  const [rideId, setRideId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [state, setState] = useState<BookingState>("confirm");
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const routeProgress = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [enteredCode, setEnteredCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<number>(0);

  const pickupLoc =
    CAMPUS_LOCATIONS.find((l) => l.name === params.pickup) ??
    CAMPUS_LOCATIONS[0];
  const destLoc =
    CAMPUS_LOCATIONS.find((l) => l.name === params.destination) ??
    CAMPUS_LOCATIONS[1];

  useEffect(() => {
    if (state === "searching") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      const timer = setTimeout(() => {
        setState("matched");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // useEffect(() => {
  //   if (state === "processing-payment") {
  //     Animated.loop(
  //       Animated.sequence([
  //         Animated.timing(paymentAnim, {
  //           toValue: -10, // Bounces up
  //           duration: 400,
  //           useNativeDriver: true,
  //         }),
  //         Animated.timing(paymentAnim, {
  //           toValue: 0, // Bounces back down
  //           duration: 400,
  //           useNativeDriver: true,
  //         }),
  //       ]),
  //     ).start();
  //   }

  //   if (state === "completed") {
  //     paymentAnim.stopAnimation(); // Stop the bounce
  //     // Trigger the success checkmark animation
  //     Animated.spring(scaleAnim, {
  //       toValue: 1,
  //       tension: 50,
  //       friction: 7,
  //       useNativeDriver: true,
  //     }).start();
  //   }
  // }, [state]);

  useEffect(() => {
    if (state === "enroute") {
      Animated.timing(routeProgress, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: false,
      }).start();
    }
  }, [state]);

  useEffect(() => {
    if (state === "processing-payment") {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ).start();
    }

    if (state === "completed") {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [state]);

  const handleConfirmBooking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!user) {
      Alert.alert("Error", "You must be logged in to book a ride.");
      return;
    }

    const fare = parseInt(params.fare ?? "200", 10);
    if (user.walletBalance < fare && params.paymentMethod === "Wallet") {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough money in your wallet to book this ride.",
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/rides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          origin: params.pickup,
          destination: params.destination,
          fare,
          paymentMethod: params.paymentMethod,
        }),
        homeBtn: {
          backgroundColor: Colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 8,
          marginTop: 32,
        },
        homeBtnText: {
          color: Colors.white,
          fontSize: 16,
          fontFamily: "PlusJakartaSans_700Bold",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to parse error response from server.",
        }));
        throw new Error(errorData.message || "Failed to create ride.");
      }

      const newRide = await response.json();
      setRideId(newRide.ride.id);
      setVerificationCode(newRide.ride.verificationCode);
      setState("searching");
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert(
        "Booking Failed",
        "Could not book the ride. Please try again.",
      );
    }
  };

  const handleProceedToVerify = () => {
    setState("verifying");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleVerifyCode = () => {
    if (enteredCode.length !== 4) {
      setCodeError("Please enter the 4-digit code");
      return;
    }
    if (enteredCode === verificationCode) {
      setState("enroute");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setCodeError("Incorrect code. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleChatDriver = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/chat" as never,
      params: { driverName: params.driverName ?? "Your Driver" },
    });
  };

  const handleCallDriver = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would initiate a VoIP call via a service like Twilio
    Alert.alert(
      "Initiate Call",
      `Calling ${params.driverName ?? "your driver"}...`,
      [{ text: "OK" }],
    );
  };

  const handleCompleteRide = async () => {
    if (!rideId) {
      Alert.alert("Error", "Ride ID not found.");
      return;
    }
    try {
      // Mark the ride as completed on the backend
      const response = await fetch(`${API_URL}/rides/${rideId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to complete ride.");
      }

      // Transition to the payment processing/completed state
      setState("processing-payment");

      // Simulate payment processing and then show completion
      setTimeout(() => {
        setState("completed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // After completion, navigate to the home page with params
        setTimeout(() => {
          router.replace({
            pathname: "/" as never,
            params: {
              rideId: rideId,
              driverName: params.driverName,
              fare: params.fare,
            },
          });
        }, 1500); // Wait a moment on the "completed" screen
      }, 2000); // Simulate 2 seconds of payment processing
    } catch (error) {
      console.error("Error completing ride:", error);
      Alert.alert("Error", "Could not complete the ride. Please try again.");
    }
  };

  const handleGoHome = () => {
    router.replace({
      pathname: "/" as never,
      params: {
        rideId: rideId,
        driverName: params.driverName,
        fare: params.fare,
      },
    });
  };

  const routeCoords = [
    { latitude: pickupLoc.latitude, longitude: pickupLoc.longitude },
    {
      latitude: (pickupLoc.latitude + destLoc.latitude) / 2 + 0.002,
      longitude: (pickupLoc.longitude + destLoc.longitude) / 2 - 0.001,
    },
    { latitude: destLoc.latitude, longitude: destLoc.longitude },
  ];

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {state === "confirm"
            ? "Confirm Ride"
            : state === "searching"
              ? "Finding Driver"
              : state === "matched"
                ? "Ride Matched!"
                : state === "verifying"
                  ? "Verify Pickup"
                  : state === "enroute"
                    ? "En Route"
                    : state === "completed"
                      ? "Ride Completed"
                      : "Processing Payment"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {state === "processing-payment" && (
        <View style={styles.searchingContent}>
          <Animated.View
            style={[
              styles.searchCircle,
              { transform: [{ rotate: spin }], opacity: 1 },
            ]}
          >
            <View style={styles.searchCircleInner}>
              <Wallet size={40} color={Colors.primary} />
            </View>
          </Animated.View>
          <Text style={styles.searchTitle}>Processing Payment...</Text>
          <Text style={styles.searchDesc}>
            Please wait while we securely process your payment.
          </Text>
        </View>
      )}

      {state === "completed" && (
        <View style={styles.matchedContent}>
          <Animated.View
            style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}
          >
            <Check size={48} color={Colors.white} />
          </Animated.View>
          <Text style={styles.matchedTitle}>Payment Successful!</Text>
          <Text style={styles.matchedDesc}>
            Your payment has been processed. You will be redirected shortly.
          </Text>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleGoHome}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>GO TO HOMEPAGE</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "confirm" && (
        <View style={styles.content}>
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View
                style={[styles.routeDot, { backgroundColor: Colors.primary }]}
              />
              <View>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeValue}>
                  {params.pickup ?? "Senate Building"}
                </Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View
                style={[styles.routeDot, { backgroundColor: Colors.red }]}
              />
              <View>
                <Text style={styles.routeLabel}>DESTINATION</Text>
                <Text style={styles.routeValue}>
                  {params.destination ?? "Library Junction"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passengers</Text>
              <Text style={styles.detailValue}>
                {params.passengers ?? "1"} person(s)
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={styles.detailValue}>
                {params.paymentMethod ?? "Wallet"}
              </Text>
            </View>
            {params.voucher ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Voucher</Text>
                <Text style={[styles.detailValue, { color: Colors.primary }]}>
                  {params.voucher}
                </Text>
              </View>
            ) : null}
            {params.driverName ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Driver</Text>
                <Text style={styles.detailValue}>{params.driverName}</Text>
              </View>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>₦{params.fare ?? "200"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmBooking}
            activeOpacity={0.85}
          >
            <Zap size={18} color={Colors.white} />
            <Text style={styles.confirmBtnText}>CONFIRM BOOKING</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "searching" && (
        <View style={styles.searchingContent}>
          <Animated.View style={[styles.searchCircle, { opacity: pulseAnim }]}>
            <View style={styles.searchCircleInner}>
              <Clock size={40} color={Colors.primary} />
            </View>
          </Animated.View>
          <Text style={styles.searchTitle}>Finding your ride...</Text>
          <Text style={styles.searchDesc}>
            Matching you with the nearest verified keke pilot on campus
          </Text>
        </View>
      )}

      {state === "matched" && (
        <View style={styles.matchedContent}>
          <Animated.View
            style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}
          >
            <Check size={48} color={Colors.white} />
          </Animated.View>
          <Text style={styles.matchedTitle}>Ride Confirmed!</Text>
          <Text style={styles.matchedDesc}>
            {params.driverName ?? "Your driver"} is on the way to{" "}
            {params.pickup ?? "your pickup"}
          </Text>

          <View style={styles.codeCard}>
            <ShieldCheck size={24} color={Colors.primary} />
            <View style={styles.codeCardInfo}>
              <Text style={styles.codeCardLabel}>YOUR PICKUP CODE</Text>
              <Text style={styles.codeCardValue}>{verificationCode}</Text>
            </View>
          </View>
          <Text style={styles.codeHint}>
            Share this code with your driver to confirm pickup. Do NOT board
            without verification.
          </Text>

          <View style={styles.matchedActions}>
            <TouchableOpacity
              style={styles.chatDriverBtn}
              onPress={handleProceedToVerify}
              activeOpacity={0.85}
            >
              <Text style={styles.chatDriverText}>Driver Has Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleChatDriver}
              activeOpacity={0.85}
            >
              <MessageSquare size={20} color={Colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleCallDriver}
              activeOpacity={0.85}
            >
              <Phone size={20} color={Colors.dark} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === "verifying" && (
        <View style={styles.verifyContent}>
          <View style={styles.verifyIconWrap}>
            <Phone size={36} color={Colors.primary} />
          </View>
          <Text style={styles.verifyTitle}>Verify Your Pickup</Text>
          <Text style={styles.verifyDesc}>
            Tell the driver your 4-digit confirmation code to verify your
            identity. Then enter it below to confirm.
          </Text>

          <View style={styles.verifyCodeDisplay}>
            <Text style={styles.verifyCodeLabel}>YOUR CODE</Text>
            <Text style={styles.verifyCodeValue}>{verificationCode}</Text>
          </View>

          <Text style={styles.inputLabel}>ENTER CODE TO CONFIRM</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="••••"
            placeholderTextColor={Colors.lightGray}
            value={enteredCode}
            onChangeText={(t) => {
              setEnteredCode(t);
              setCodeError("");
            }}
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
            secureTextEntry
          />
          {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              enteredCode.length !== 4 && styles.confirmBtnDisabled,
            ]}
            onPress={handleVerifyCode}
            activeOpacity={0.85}
            disabled={enteredCode.length !== 4}
          >
            <ShieldCheck size={18} color={Colors.white} />
            <Text style={styles.confirmBtnText}>CONFIRM PICKUP</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "enroute" && (
        <View style={styles.enrouteContainer}>
          {Platform.OS !== "web" && MapView ? (
            <MapView
              style={styles.enrouteMap}
              initialRegion={{
                latitude: (pickupLoc.latitude + destLoc.latitude) / 2,
                longitude: (pickupLoc.longitude + destLoc.longitude) / 2,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              showsUserLocation
            >
              <Marker
                coordinate={{
                  latitude: pickupLoc.latitude,
                  longitude: pickupLoc.longitude,
                }}
                title="Pickup"
                pinColor={Colors.primary}
              />
              <Marker
                coordinate={{
                  latitude: destLoc.latitude,
                  longitude: destLoc.longitude,
                }}
                title="Destination"
                pinColor={Colors.red}
              />
              <Polyline
                coordinates={routeCoords}
                strokeColor={Colors.primary}
                strokeWidth={4}
              />
            </MapView>
          ) : (
            <View style={styles.webEnrouteMap}>
              <Navigation size={48} color={Colors.primary} />
              <Text style={styles.webEnrouteTitle}>
                En Route to Destination
              </Text>
              <View style={styles.webRouteRow}>
                <View
                  style={[styles.routeDot, { backgroundColor: Colors.primary }]}
                />
                <Text style={styles.webRouteLabel}>{params.pickup}</Text>
                <Text style={styles.webRouteArrow}>
                  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢
                </Text>
                <View
                  style={[styles.routeDot, { backgroundColor: Colors.red }]}
                />
                <Text style={styles.webRouteLabel}>{params.destination}</Text>
              </View>
            </View>
          )}

          <View
            style={[styles.enroutePanel, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.enrouteHeader}>
              <View>
                <Text style={styles.enrouteTitle}>On Your Way!</Text>
                <Text style={styles.enrouteSub}>
                  ESTIMATED ARRIVAL: 5-8 MIN
                </Text>
              </View>
              <View style={styles.enrouteStatusBadge}>
                <View style={styles.enrouteLiveDot} />
                <Text style={styles.enrouteLiveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.enrouteProgressBar}>
              <Animated.View
                style={[
                  styles.enrouteProgressFill,
                  {
                    width: routeProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.enrouteRoute}>
              <View style={styles.enrouteRouteItem}>
                <View
                  style={[styles.routeDot, { backgroundColor: Colors.primary }]}
                />
                <Text style={styles.enrouteRouteText}>{params.pickup}</Text>
              </View>
              <View style={styles.enrouteRouteLine} />
              <View style={styles.enrouteRouteItem}>
                <View
                  style={[styles.routeDot, { backgroundColor: Colors.red }]}
                />
                <Text style={styles.enrouteRouteText}>
                  {params.destination}
                </Text>
              </View>
            </View>

            <View style={styles.enrouteActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleChatDriver}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Chat Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goHomeBtn}
                onPress={handleCompleteRide}
                activeOpacity={0.85}
              >
                <Text style={styles.goHomeText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
  {
    state === "processing-payment" && (
      <View style={styles.paymentContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <View style={styles.paymentIconWrapper}>
            <Wallet size={40} color={Colors.primary} />
          </View>
        </Animated.View>
        <Text style={styles.paymentTitle}>Processing Payment</Text>
        <Text style={styles.paymentDesc}>
          Please wait, this will only take a moment.
        </Text>
      </View>
    );
  }

  {
    state === "completed" && (
      <View style={styles.paymentContainer}>
        <Animated.View
          style={[
            styles.paymentIconWrapper,
            styles.successIcon,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Check size={48} color={Colors.white} />
        </Animated.View>
        <Text style={styles.paymentTitle}>Payment Successful!</Text>
        <Text style={styles.paymentDesc}>
          ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦
          {params.fare ?? "0"} has been paid for your ride.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  routeCard: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  fareValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: "500" as const,
  },
  tipSection: {
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.gray,
    textAlign: "center",
    marginBottom: 12,
  },
  tipOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tipBtn: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tipBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  tipBtnTextSelected: {
    color: Colors.white,
  },
  searchingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  searchCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  searchCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 8,
  },
  searchDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 21,
  },
  matchedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  matchedTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 8,
  },
  matchedDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 21,
    marginBottom: 24,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  codeCardInfo: {
    flex: 1,
  },
  codeCardLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
  },
  codeCardValue: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.primaryDark,
    letterSpacing: 8,
    marginTop: 4,
  },
  codeHint: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  matchedActions: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatDriverBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  chatDriverText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  secondaryBtn: {
    backgroundColor: Colors.background,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  goHomeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
  },
  goHomeText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  verifyContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    alignItems: "center",
  },
  verifyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 8,
  },
  verifyDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 21,
    marginBottom: 24,
  },
  verifyCodeDisplay: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    width: "100%",
  },
  verifyCodeLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
  },
  verifyCodeValue: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.primaryDark,
    letterSpacing: 10,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  codeInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    letterSpacing: 12,
    width: "100%",
  },
  codeError: {
    fontSize: 12,
    color: Colors.red,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  enrouteContainer: {
    flex: 1,
  },
  enrouteMap: {
    flex: 1,
  },
  webEnrouteMap: {
    flex: 1,
    backgroundColor: "#E8F0E8",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  webEnrouteTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  webRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  webRouteLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  webRouteArrow: {
    fontSize: 16,
    color: Colors.gray,
  },
  enroutePanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  enrouteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  enrouteTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  enrouteSub: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  enrouteStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  enrouteLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  enrouteLiveText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.green,
    letterSpacing: 0.5,
  },
  enrouteProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  enrouteProgressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  enrouteRoute: {
    marginBottom: 16,
  },
  enrouteRouteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  enrouteRouteLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: 2,
  },
  enrouteRouteText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  enrouteActions: {
    flexDirection: "row",
    gap: 12,
  },
  paymentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: Colors.background,
  },
  paymentIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    marginBottom: 32,
  },
  successIcon: {
    backgroundColor: Colors.green,
  },
  paymentTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  paymentDesc: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 22,
  },
});
