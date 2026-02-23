import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useNotifications } from "../providers/NotificationProvider";
import Colors from "../constants/color";
import { BellDot, Bell, CheckCheck } from "lucide-react-native";

const NotificationsScreen = () => {
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } =
    useNotifications();
  console.log("Notifications on screen:", notifications);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => !item.isRead && markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        {!item.isRead ? (
          <BellDot color={Colors.primary} size={26} />
        ) : (
          <Bell color={Colors.gray} size={26} />
        )}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={styles.markAllButton}
        >
          <CheckCheck size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={Colors.lightGray} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
          <Text style={styles.emptySubText}>
            We'll let you know when something important happens.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark,
  },
  markAllButton: {
    padding: 5,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  unreadItem: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  iconWrapper: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.darkGray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
});

export default NotificationsScreen;
