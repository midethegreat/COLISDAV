import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Lock, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";

export default function PinSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updatePin } = useAuth();
  const [currentPin, setCurrentPin] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleUpdatePin = async () => {
    setError("");
    if (currentPin.length < 4) {
      setError("Enter your current 4-digit PIN");
      return;
    }
    if (newPin.length < 4) {
      setError("New PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PINs do not match");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await updatePin(currentPin, newPin);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update PIN";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContent}>
          <View style={styles.successCircle}>
            <Check size={40} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>PIN Updated!</Text>
          <Text style={styles.successDesc}>
            Your security PIN has been changed successfully
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security PIN</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Lock size={28} color={Colors.primary} />
          </View>
          <Text style={styles.desc}>
            Update your 4-digit security PIN used for app login and payment
            authorization
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CURRENT PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current PIN"
              placeholderTextColor={Colors.lightGray}
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new PIN"
              placeholderTextColor={Colors.lightGray}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM NEW PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new PIN"
              placeholderTextColor={Colors.lightGray}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.updateBtn, loading && styles.updateBtnDisabled]}
            onPress={handleUpdatePin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.updateBtnText}>
              {loading ? "Updating..." : "Update PIN"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  desc: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 21,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: Colors.redLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    fontWeight: "500" as const,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: "600" as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updateBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  updateBtnDisabled: {
    opacity: 0.5,
  },
  updateBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  successContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center" as const,
  },
});
