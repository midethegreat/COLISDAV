import * as Location from "expo-location";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
  Modal,
  Image,
  PanResponder,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Menu,
  ShieldCheck,
  Crosshair,
  Zap,
  MapPin,
  ChevronDown,
  Minus,
  Plus,
  Ticket,
  MessageCircle,
  Bell,
  ChevronUp,
  X,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import {
  CAMPUS_CENTER,
  CAMPUS_LOCATIONS,
  FUNAAB_BOUNDS,
} from "../constants/campus";
import { useAuth } from "../providers/AuthProvider";
import DrawerMenu from "../components/DrawerMenu";
import { MOCK_VOUCHERS } from "../mocks/data";
import { CampusLocation, Voucher } from "@/types";

let MapView: any;
let Marker: any;
let Polyline: any;
let AnimatedRegion: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  AnimatedRegion = Maps.AnimatedRegion;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COLLAPSED_HEIGHT = 90;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] =
    useState<CampusLocation | null>(null);
  const [bookingExpanded, setBookingExpanded] = useState<boolean>(false);
  const [pickup, setPickup] = useState<CampusLocation | null>(null);
  const [destination, setDestination] = useState<CampusLocation | null>(null);
  const [passengers, setPassengers] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("Wallet");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [pickingFor, setPickingFor] = useState<"pickup" | "destination">(
    "destination",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [userFollowsMap, setUserFollowsMap] = useState(true);
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<any>(null);
  const userLocationAnimated = useRef(
    Platform.OS === "web"
      ? null
      : new AnimatedRegion({
          latitude: CAMPUS_CENTER.latitude,
          longitude: CAMPUS_CENTER.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }),
  ).current;
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  const fare = 200 * passengers - (selectedVoucher?.discount ?? 0);
  const finalFare = Math.max(fare, 0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        // Optionally, show an alert to the user here.
        return;
      }

      // Only start watching if permission is granted
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          setUserLocation(newLocation);
        },
      );
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && userLocationAnimated) {
      const { latitude, longitude } = userLocation.coords;
      userLocationAnimated
        .timing({
          latitude,
          longitude,
          duration: 1000, // Animate over 1 second
        })
        .start();
    }
  }, [userLocation]);

  useEffect(() => {
    if (userLocation && userFollowsMap) {
      // Find the closest campus location to the user's current position
      let closestLocation: CampusLocation | null = null;
      let minDistance = Infinity;

      const userLat = userLocation.coords.latitude;
      const userLon = userLocation.coords.longitude;

      CAMPUS_LOCATIONS.forEach((location) => {
        // Simple distance calculation, good enough for small areas
        const distance = Math.sqrt(
          Math.pow(location.latitude - userLat, 2) +
            Math.pow(location.longitude - userLon, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = location;
        }
      });

      // Set the pickup to the closest named location
      if (closestLocation) {
        setPickup(closestLocation);
      }

      // Animate the map to follow the user's actual GPS position
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: userLat,
            longitude: userLon,
            latitudeDelta: 0.01, // A good zoom level for tracking
          },
          1000, // Smooth animation
        );
      }
    }
  }, [userLocation, userFollowsMap]);

  useEffect(() => {
    if (pickup && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.002, // High-precision zoom
          longitudeDelta: 0.002,
        },
        800, // Faster animation
      );
    }
  }, [pickup]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const expandSheet = () => {
    setBookingExpanded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(sheetHeight, {
      toValue: EXPANDED_HEIGHT,
      tension: 65,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  const collapseSheet = () => {
    setBookingExpanded(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(sheetHeight, {
      toValue: COLLAPSED_HEIGHT,
      tension: 65,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  const toggleSheet = () => {
    if (bookingExpanded) {
      collapseSheet();
    } else {
      expandSheet();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const currentHeight = bookingExpanded
          ? EXPANDED_HEIGHT
          : COLLAPSED_HEIGHT;
        const newHeight = currentHeight - gestureState.dy;
        const clampedHeight = Math.max(
          COLLAPSED_HEIGHT,
          Math.min(EXPANDED_HEIGHT, newHeight),
        );
        sheetHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const midpoint = (EXPANDED_HEIGHT + COLLAPSED_HEIGHT) / 2;
        const currentHeight = bookingExpanded
          ? EXPANDED_HEIGHT
          : COLLAPSED_HEIGHT;
        const projectedHeight = currentHeight - gestureState.dy;

        if (gestureState.dy < -50 || projectedHeight > midpoint) {
          expandSheet();
        } else {
          collapseSheet();
        }
      },
    }),
  ).current;

  const handleMarkerPress = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    setDestination(loc);
    expandSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const filteredLocations = useMemo(() => {
    // If the user is searching, filter by the search query
    if (searchQuery) {
      return CAMPUS_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // If not searching and user location is available, sort by proximity
    if (userLocation) {
      const sortedLocations = [...CAMPUS_LOCATIONS].sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.latitude - userLocation.coords.latitude, 2) +
            Math.pow(a.longitude - userLocation.coords.longitude, 2),
        );
        const distB = Math.sqrt(
          Math.pow(b.latitude - userLocation.coords.latitude, 2) +
            Math.pow(b.longitude - userLocation.coords.longitude, 2),
        );
        return distA - distB;
      });
      return sortedLocations;
    }

    // If no user location, return the default list
    return CAMPUS_LOCATIONS;
  }, [searchQuery, userLocation]);

  const handleConfirm = () => {
    if (!pickup || !destination) return;

    // Generate a random 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Navigating to booking-confirm with params:", {
      pickup: pickup.name,
      destination: destination.name,
      fare: finalFare.toString(),
      passengers: passengers.toString(),
      paymentMethod,
      voucher: selectedVoucher?.code ?? "",
      verificationCode,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/booking-confirm" as never,
      params: {
        pickup: pickup.name,
        destination: destination.name,
        fare: finalFare.toString(),
        passengers: passengers.toString(),
        paymentMethod,
        voucher: selectedVoucher?.code ?? "",
        verificationCode,
      },
    });
  };

  const openLocationPicker = (type: "pickup" | "destination") => {
    setPickingFor(type);
    setShowLocationPicker(true);
  };

  const closeLocationPicker = () => {
    setShowLocationPicker(false);
    setSearchQuery("");
  };

  const handleConfirmLocation = () => {
    if (!searchQuery) return;

    const newLocation: CampusLocation = {
      id: `custom-${Date.now()}`,
      name: searchQuery,
      latitude: CAMPUS_CENTER.latitude,
      longitude: CAMPUS_CENTER.longitude,
    };
    selectLocation(newLocation);
  };

  const selectLocation = (loc: CampusLocation) => {
    if (pickingFor === "pickup") {
      setPickup(loc);
      setUserFollowsMap(false); // User has manually selected, stop following.
    } else {
      setDestination(loc);
      // Only fit to coordinates if we have both a pickup and the new destination
      if (pickup && mapRef.current) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: loc.latitude, longitude: loc.longitude },
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true,
          },
        );
      }
    }
    setShowLocationPicker(false);
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (pickup && destination) {
      // Draw a straight line between pickup and destination
      const straightLineRoute = [
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ];
      setRouteCoords(straightLineRoute);
    } else {
      // Clear the route if either pickup or destination is not set
      setRouteCoords([]);
    }
  }, [pickup, destination]);

  const renderMap = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.webMap}>
          <View style={styles.webMapGrid}>
            {CAMPUS_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.webMapPin,
                  destination?.id === loc.id && styles.webMapPinActive,
                ]}
                onPress={() => handleMarkerPress(loc)}
              >
                <MapPin
                  size={14}
                  color={
                    destination?.id === loc.id ? Colors.white : Colors.primary
                  }
                />
                <Text
                  style={[
                    styles.webMapPinText,
                    destination?.id === loc.id && styles.webMapPinTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {destination && (
            <View style={styles.webRouteInfo}>
              <View
                style={[styles.locDot, { backgroundColor: Colors.primary }]}
              />
              <Text style={styles.webRouteText}>{pickup.name}</Text>
              <Text style={styles.webRouteArrow}>
                ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢
              </Text>
              <View style={[styles.locDot, { backgroundColor: Colors.red }]} />
              <Text style={styles.webRouteText}>{destination.name}</Text>
            </View>
          )}
        </View>
      );
    }
    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={CAMPUS_CENTER}
        showsUserLocation={false} // We use a custom marker
        showsMyLocationButton={false}
        minZoomLevel={14}
        maxZoomLevel={18}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {pickup && (
          <Marker
            key="pickup-marker"
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup"
            pinColor={"green"}
          />
        )}
        {destination && (
          <Marker
            key="destination-marker"
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            pinColor={Colors.red}
          />
        )}
        {destination && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerOpen(true)}
          testID="menu-btn"
        >
          <Menu size={22} color={Colors.dark} />
        </TouchableOpacity>

        <View style={styles.safeBadge}>
          <ShieldCheck size={16} color={Colors.primary} />
          <Text style={styles.safeText}>KEKE SAFE</Text>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push("/notifications" as never)}
            testID="notifications-btn"
          >
            <Bell size={20} color={Colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push("/profile" as never)}
          >
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarLetter}>
                {user?.fullName?.charAt(0) ?? "U"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.locateBtn,
          {
            bottom: (bookingExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT) + 16,
            right: 16,
          },
        ]}
        onPress={() => {
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.01,
              },
              500,
            );
          }
        }}
      >
        <Crosshair size={22} color={Colors.primary} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.bookingSheet,
          {
            height: sheetHeight,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
          <View style={styles.sheetHandle} />
        </View>

        {!bookingExpanded ? (
          <TouchableOpacity
            style={styles.collapsedContent}
            onPress={expandSheet}
            activeOpacity={0.9}
          >
            <View style={styles.collapsedLeft}>
              <View style={styles.collapsedIcon}>
                <MapPin size={18} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.collapsedTitle}>Where are you going?</Text>
                <Text style={styles.collapsedSub}>
                  Tap to book a campus ride
                </Text>
              </View>
            </View>
            <ChevronUp size={20} color={Colors.gray} />
          </TouchableOpacity>
        ) : (
          <View style={styles.expandedContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Quick Booking</Text>
                <Text style={styles.sheetSubtitle}>SAFE CAMPUS COMMUTE</Text>
              </View>
              <TouchableOpacity
                onPress={collapseSheet}
                style={styles.closeSheetBtn}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => openLocationPicker("pickup")}
            >
              <View
                style={[styles.locDot, { backgroundColor: Colors.primary }]}
              />
              <View style={styles.locInfo}>
                <Text style={styles.locLabel}>PICKUP</Text>
                <Text style={styles.locName}>
                  {pickup?.name ?? "Select pickup location"}, FUNAAB
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => openLocationPicker("destination")}
            >
              <View style={[styles.locDot, { backgroundColor: Colors.red }]} />
              <View style={styles.locInfo}>
                <Text style={styles.locLabel}>DESTINATION</Text>
                <Text style={styles.locName}>
                  {destination?.name ?? "Select destination"}
                </Text>
              </View>
              {destination ? (
                <TouchableOpacity
                  onPress={() => setDestination(null)}
                  style={styles.removeBtn}
                >
                  <X size={18} color={Colors.gray} />
                </TouchableOpacity>
              ) : (
                <ChevronRight size={18} color={Colors.gray} />
              )}
            </TouchableOpacity>

            <View style={styles.passengerRow}>
              <View style={styles.passengerLeft}>
                <Text style={styles.passengerLabel}>BOOKING FOR</Text>
                <Text style={styles.passengerValue}>
                  {passengers} Person{passengers > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.passengerControls}>
                <TouchableOpacity
                  style={styles.pmBtn}
                  onPress={() => {
                    if (passengers > 1) setPassengers(passengers - 1);
                  }}
                >
                  <Minus size={16} color={Colors.dark} />
                </TouchableOpacity>
                <Text style={styles.pmCount}>{passengers}</Text>
                <TouchableOpacity
                  style={styles.pmBtn}
                  onPress={() => {
                    if (passengers < 4) setPassengers(passengers + 1);
                  }}
                >
                  <Plus size={16} color={Colors.dark} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() =>
                  setPaymentMethod(
                    paymentMethod === "Wallet" ? "Cash" : "Wallet",
                  )
                }
              >
                <Text style={styles.payOptLabel}>METHOD</Text>
                <Text style={styles.payOptValue}>{paymentMethod}</Text>
                <ChevronRight size={16} color={Colors.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => setShowVoucherModal(true)}
              >
                <Text style={styles.payOptLabel}>VOUCHER</Text>
                <Text
                  style={[
                    styles.payOptValue,
                    { color: selectedVoucher ? Colors.primary : Colors.gray },
                  ]}
                >
                  {selectedVoucher ? selectedVoucher.code : "Select"}
                </Text>
                <ChevronRight size={16} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !destination && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={!destination}
              testID="confirm-booking-btn"
            >
              {destination ? (
                <>
                  <Text style={styles.confirmText}>CONFIRM BOOKING</Text>
                  <Text style={styles.confirmText}>₦{finalFare}</Text>
                </>
              ) : (
                <Text style={styles.confirmText}>SELECT A DESTINATION</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              FAST DISPATCH SECURE CAMPUS NETWORK
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.aiFab,
          {
            bottom: (bookingExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT) + 16,
            transform: [{ scale: fabPulse }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.aiFabInner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/support-hub" as never);
          }}
          activeOpacity={0.85}
          testID="ai-support-fab"
        >
          <MessageCircle size={22} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={showLocationPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <Text style={styles.pickerTitle}>
              Select {pickingFor === "pickup" ? "Pickup" : "Destination"}
            </Text>
            <View style={styles.searchContainer}>
              <MapPin size={20} color={Colors.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.gray}
              />
            </View>
            <ScrollView style={styles.pickerList}>
              {filteredLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.pickerItem}
                  onPress={() => selectLocation(loc)}
                >
                  <Text style={styles.pickerItemText}>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerConfirm}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.pickerConfirmText}>Confirm Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerClose}
              onPress={closeLocationPicker}
            >
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showVoucherModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <Text style={styles.pickerTitle}>Select Voucher</Text>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedVoucher(null);
                  setShowVoucherModal(false);
                }}
              >
                <Ticket size={18} color={Colors.gray} />
                <Text style={styles.pickerItemText}>No voucher</Text>
              </TouchableOpacity>
              {MOCK_VOUCHERS.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedVoucher(v);
                    setShowVoucherModal(false);
                  }}
                >
                  <Ticket size={18} color={Colors.primary} />
                  <View style={styles.voucherInfo}>
                    <Text style={styles.pickerItemText}>{v.code}</Text>
                    <Text style={styles.voucherDesc}>{v.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerClose}
              onPress={() => setShowVoucherModal(false)}
            >
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  rideIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  webMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8F0E8",
    padding: 16,
    paddingTop: 120,
  },
  webMapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  webMapPin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  webMapPinActive: {
    backgroundColor: Colors.primary,
  },
  webMapPinText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.dark,
    maxWidth: 100,
  },
  webMapPinTextActive: {
    color: Colors.white,
  },
  webRouteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
    alignSelf: "center",
  },
  webRouteText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  webRouteArrow: {
    fontSize: 16,
    color: Colors.gray,
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  menuBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safeText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notifDot: {
    position: "absolute",
    top: 11,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  locateBtn: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
  },
  bookingSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 20,
    overflow: "hidden",
  },
  sheetHandleArea: {
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: "center",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  collapsedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    flex: 1,
  },
  collapsedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  collapsedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  collapsedSub: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  footer: {
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  sheetSubtitle: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  closeSheetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    padding: 5,
  },
  removeBtn: {
    padding: 5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  locDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locInfo: {
    flex: 1,
  },
  locLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  locName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginTop: 2,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  passengerLeft: {
    gap: 2,
  },
  passengerLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  passengerValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  passengerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pmBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  pmCount: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
    minWidth: 20,
    textAlign: "center" as const,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payOptLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
    position: "absolute",
    top: 8,
    left: 14,
  },
  payOptValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginTop: 14,
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.lightGray,
    textAlign: "center" as const,
    marginTop: 10,
    marginBottom: 16,
    letterSpacing: 0.8,
  },
  aiFab: {
    position: "absolute",
    left: 16,
    zIndex: 15,
  },
  aiFabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0D3320",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 8,
    color: Colors.dark,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  voucherInfo: {
    flex: 1,
    gap: 2,
  },
  voucherDesc: {
    fontSize: 12,
    color: Colors.gray,
  },
  pickerConfirm: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  pickerConfirmText: {
    color: Colors.white,
    fontWeight: "600" as const,
    fontSize: 16,
  },
  pickerClose: {
    alignItems: "center",
    paddingVertical: 16,
  },
  pickerCloseText: {
    fontSize: 15,
    color: Colors.gray,
    fontWeight: "600" as const,
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "green",
    borderWidth: 2,
    borderColor: "white",
  },
});
