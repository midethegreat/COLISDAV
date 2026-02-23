import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, Bell, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "../constants/color";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
}

export default function Header({
  title,
  subtitle,
  showBackButton = false,
  onMenuPress,
  onNotificationsPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleNotifications = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      router.push("/notifications" as never);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.button} onPress={handleBackPress}>
            <ArrowLeft size={22} color={Colors.dark} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={onMenuPress}>
            <Menu size={22} color={Colors.dark} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNotifications}>
          <Bell size={22} color={Colors.dark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 0.8,
    marginTop: 1,
    textTransform: "uppercase",
  },
});
