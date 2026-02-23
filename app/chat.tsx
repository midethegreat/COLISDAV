import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Phone,
  Send,
  X,
  Star,
  Shield,
  Car,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { ChatMessage } from "../types";
import { MOCK_CHAT_MESSAGES, MOCK_DRIVERS } from "../mocks/data";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    driverName?: string;
    driverId?: string;
  }>();
  const driverName = params.driverName ?? "Ayomide Cole";
  const driverId = params.driverId ?? "2";

  const driver = MOCK_DRIVERS.find((d) => d.id === driverId) ?? MOCK_DRIVERS[1];

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [inputText, setInputText] = useState<string>("");
  const [showDriverProfile, setShowDriverProfile] = useState<boolean>(false);
  const profileSlide = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const openProfile = () => {
    setShowDriverProfile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(profileSlide, {
      toValue: 1,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const closeProfile = () => {
    Animated.timing(profileSlide, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowDriverProfile(false));
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Got it! I'll be there in about 3 minutes.",
        sender: "driver",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const profileTranslateY = profileSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.driverHeaderInfo}
          onPress={openProfile}
          activeOpacity={0.7}
        >
          <View style={styles.driverAvatar}>
            <Image
              source={{ uri: driver.image }}
              style={styles.driverAvatarImg}
            />
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.onlineText}>ONLINE • TAP FOR PROFILE</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Phone size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender === "user" ? styles.userBubble : styles.driverBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.sender === "user" ? styles.userText : styles.driverText,
                ]}
              >
                {msg.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  msg.sender === "user"
                    ? styles.userTimestamp
                    : styles.driverTimestamp,
                ]}
              >
                {msg.timestamp}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.lightGray}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showDriverProfile} transparent animationType="none">
        <View style={styles.profileOverlay}>
          <TouchableOpacity
            style={styles.profileOverlayBg}
            onPress={closeProfile}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.profileSheet,
              {
                paddingBottom: insets.bottom + 20,
                transform: [{ translateY: profileTranslateY }],
              },
            ]}
          >
            <View style={styles.profileHandleArea}>
              <View style={styles.profileHandle} />
            </View>

            <TouchableOpacity
              style={styles.profileCloseBtn}
              onPress={closeProfile}
            >
              <X size={18} color={Colors.gray} />
            </TouchableOpacity>

            <View style={styles.profileHeader}>
              <Image
                source={{ uri: driver.image }}
                style={styles.profileImage}
              />
              <Text style={styles.profileName}>{driver.name}</Text>
              <Text style={styles.profilePlate}>{driver.plateNumber}</Text>
              {driver.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield size={12} color={Colors.white} />
                  <Text style={styles.verifiedText}>VERIFIED DRIVER</Text>
                </View>
              )}
            </View>

            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Star size={18} color={Colors.accent} />
                <Text style={styles.statValue}>{driver.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Car size={18} color={Colors.primary} />
                <Text style={styles.statValue}>{driver.totalSeats}</Text>
                <Text style={styles.statLabel}>Seats</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MapPin size={18} color={Colors.red} />
                <Text style={styles.statValue}>{driver.distance}m</Text>
                <Text style={styles.statLabel}>Away</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Clock size={18} color={Colors.green} />
                <Text style={styles.statValue}>
                  ~{Math.ceil(driver.distance / 80)}min
                </Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tricycle Type</Text>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        driver.tricycleType === "yellow"
                          ? "#FEF3C7"
                          : "#D1FAE5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      {
                        color:
                          driver.tricycleType === "yellow"
                            ? "#92400E"
                            : "#065F46",
                      },
                    ]}
                  >
                    {driver.tricycleType.charAt(0).toUpperCase() +
                      driver.tricycleType.slice(1)}{" "}
                    Keke
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: driver.online
                          ? Colors.green
                          : Colors.lightGray,
                      },
                    ]}
                  />
                  <Text style={styles.detailValue}>
                    {driver.online ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fare</Text>
                <Text style={styles.detailValue}>₦{driver.fare}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Available Seats</Text>
                <Text style={styles.detailValue}>
                  {driver.totalSeats - driver.occupiedSeats} /{" "}
                  {driver.totalSeats}
                </Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.profileCallBtn}
                onPress={handleCall}
              >
                <Phone size={18} color={Colors.white} />
                <Text style={styles.profileCallText}>Call Driver</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  driverHeaderInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  driverAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  driverBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: Colors.white,
  },
  driverText: {
    color: Colors.dark,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  userTimestamp: {
    color: "rgba(255,255,255,0.6)",
  },
  driverTimestamp: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 14,
    color: Colors.dark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  profileOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  profileOverlayBg: {
    flex: 1,
  },
  profileSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
  },
  profileHandleArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  profileHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  profileCloseBtn: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  profilePlate: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.gray,
    marginTop: 4,
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.gray,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  profileDetails: {
    gap: 14,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileActions: {
    gap: 10,
  },
  profileCallBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  profileCallText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
