import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  MessageSquarePlus,
  UserCheck,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";

const previousChats = [
  {
    id: "1",
    agent: "Agent Tobi",
    lastMessage: "You are welcome! Is there anything else I can help with?",
    timestamp: "3d ago",
    isUnread: false,
    messages: [
      {
        id: "a",
        text: "Hi, I'm having trouble with my last ride. The fare seems incorrect.",
        sender: "user",
        timestamp: "3d ago",
      },
      {
        id: "b",
        text: "I'm Agent Tobi. I've reviewed your concern. Let me check the ride details.",
        sender: "agent",
        timestamp: "3d ago",
      },
      {
        id: "c",
        text: "It seems there was a system error. I've adjusted the fare. Apologies for the inconvenience.",
        sender: "agent",
        timestamp: "3d ago",
      },
      {
        id: "d",
        text: "You are welcome! Is there anything else I can help with?",
        sender: "agent",
        timestamp: "3d ago",
      },
    ],
  },
  {
    id: "2",
    agent: "Agent Funmi",
    lastMessage: "Your account has been updated. Please try again.",
    timestamp: "5d ago",
    isUnread: true,
    messages: [
      {
        id: "e",
        text: "I can't seem to top up my wallet.",
        sender: "user",
        timestamp: "5d ago",
      },
      {
        id: "f",
        text: "Hi, this is Agent Funmi. Let me look into your account.",
        sender: "agent",
        timestamp: "5d ago",
      },
      {
        id: "g",
        text: "Your account has been updated. Please try again.",
        sender: "agent",
        timestamp: "5d ago",
      },
    ],
  },
];

export default function SupportHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Conversations with Agents</Text>
        {previousChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() =>
              router.push({
                pathname: "/support",
                params: {
                  agentName: chat.agent,
                  chatHistory: JSON.stringify(chat.messages),
                },
              })
            }
          >
            <View style={styles.agentIcon}>
              <UserCheck size={24} color={Colors.accent} />
            </View>
            <View style={styles.chatDetails}>
              <Text style={styles.agentName}>{chat.agent}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>
            <View style={styles.chatMeta}>
              <Text style={styles.timestamp}>{chat.timestamp}</Text>
              {chat.isUnread && <View style={styles.unreadDot} />}
            </View>
            <ChevronRight size={20} color={Colors.gray} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => router.push("/support" as never)}
        >
          <MessageSquarePlus size={22} color={Colors.white} />
          <Text style={styles.newChatText}>Start New Chat</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    backgroundColor: Colors.white,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
    marginBottom: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chatDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark,
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  chatMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  newChatBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  newChatText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
});
