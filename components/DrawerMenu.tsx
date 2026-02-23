import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  Bus,
  Wallet,
  Grid3x3,
  Gift,
  Clock,
  User,
  LogOut,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "../constants/color";
import { CAMPUS_NAME } from "../constants/campus";
import { useAuth } from "../providers/AuthProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: Home, label: "Home", route: "/" },
  { icon: Bus, label: "Available Rides", route: "/rides" },
  { icon: Wallet, label: "My Wallet", route: "/wallet" },
  { icon: Grid3x3, label: "Other Services", route: "/services" },
  { icon: Gift, label: "Rewards Hub", route: "/rewards" },
  { icon: Clock, label: "Ride History", route: "/ride-history" },
  { icon: User, label: "Profile Settings", route: "/profile" },
] as const;

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push(route as never);
    }, 300);
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    await logout();
    setTimeout(() => {
      router.replace("/welcome" as never);
    }, 300);
  };

  if (!visible) return null;

  return (
    <View style={styles.container} testID="drawer-menu">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <ShieldCheck size={20} color={Colors.primary} />
              <Text style={styles.brandLabel}>CID</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={Colors.gray} />
            </TouchableOpacity>
          </View>
          <Text style={styles.campusName}>KEKE {CAMPUS_NAME}</Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0) ?? "U"}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.fullName?.split(" ")[0] ?? "Student"}
            </Text>
            <Text style={styles.userRole}>STUDENT</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.6}
            >
              <item.icon size={20} color={Colors.gray} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={Colors.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <LogOut size={20} color={Colors.red} />
            <Text style={styles.logoutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === "web" ? 40 : 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  campusName: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  userRole: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 12,
    gap: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.dark,
  },
  chevron: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "web" ? 30 : 50,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.red,
    letterSpacing: 0.5,
  },
});
