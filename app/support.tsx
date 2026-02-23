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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Bot, Send, UserCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { ChatMessage } from "../types";
import { AI_RESPONSES } from "../mocks/data";

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    agentName?: string;
    chatHistory?: string;
  }>();

  const isHistory = !!params.agentName;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isHistory && params.chatHistory) {
      return JSON.parse(params.chatHistory);
    }
    return [
      { id: "0", text: AI_RESPONSES[0], sender: "ai", timestamp: "Just now" },
    ];
  });

  const [inputText, setInputText] = useState<string>("");
  const [aiResponseIndex, setAiResponseIndex] = useState<number>(1);
  const [connectedToAgent, setConnectedToAgent] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

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
      const nextIndex = aiResponseIndex % AI_RESPONSES.length;
      const isAgentConnect = AI_RESPONSES[nextIndex].includes("connecting you");

      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: AI_RESPONSES[nextIndex],
        sender: connectedToAgent ? "agent" : "ai",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, reply]);
      setAiResponseIndex(nextIndex + 1);

      if (isAgentConnect) {
        setTimeout(() => {
          setConnectedToAgent(true);
          const agentMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            text: "Hi! I'm Agent Tobi. I've reviewed your concern. How can I assist you further?",
            sender: "agent",
            timestamp: "Just now",
          };
          setMessages((prev) => [...prev, agentMsg]);
        }, 2000);
      }
    }, 1500);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const quickActions = [
    "I need help with a ride",
    "Payment issue",
    "Account problem",
    "Connect me to an agent",
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {isHistory
              ? params.agentName
              : connectedToAgent
                ? "Live Agent"
                : "AI Support"}
          </Text>
          <Text style={styles.headerSub}>
            {isHistory
              ? "CONVERSATION HISTORY"
              : connectedToAgent
                ? "AGENT TOBI • ONLINE"
                : "CID ASSISTANT"}
          </Text>
        </View>
        <View
          style={[
            styles.statusIcon,
            (connectedToAgent || isHistory) && styles.agentIcon,
          ]}
        >
          {connectedToAgent || isHistory ? (
            <UserCheck size={20} color={Colors.white} />
          ) : (
            <Bot size={20} color={Colors.white} />
          )}
        </View>
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
                msg.sender === "user"
                  ? styles.userBubble
                  : msg.sender === "agent"
                    ? styles.agentBubble
                    : styles.aiBubble,
              ]}
            >
              {(msg.sender === "ai" || msg.sender === "agent") && (
                <View style={styles.senderTag}>
                  {msg.sender === "ai" ? (
                    <Bot size={12} color={Colors.primary} />
                  ) : (
                    <UserCheck size={12} color={Colors.accent} />
                  )}
                  <Text
                    style={[
                      styles.senderName,
                      msg.sender === "agent" && { color: Colors.accent },
                    ]}
                  >
                    {msg.sender === "ai"
                      ? "CID AI"
                      : isHistory
                        ? params.agentName
                        : "Agent Tobi"}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.sender === "user" ? styles.userText : styles.otherText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {messages.length <= 2 && !isHistory && (
            <View style={styles.quickActionsWrap}>
              <Text style={styles.quickActionsLabel}>Quick actions:</Text>
              {quickActions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickActionBtn}
                  onPress={() => {
                    setInputText(action);
                    setTimeout(() => sendMessage(), 100);
                  }}
                >
                  <Text style={styles.quickActionText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {!isHistory && (
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything..."
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
        )}
      </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  agentIcon: {
    backgroundColor: Colors.accent,
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
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accentLight,
    borderBottomLeftRadius: 4,
  },
  senderTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  senderName: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: Colors.white,
  },
  otherText: {
    color: Colors.dark,
  },
  quickActionsWrap: {
    marginTop: 16,
    gap: 8,
  },
  quickActionsLabel: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  quickActionBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500" as const,
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
});
