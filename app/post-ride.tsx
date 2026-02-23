import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Star, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import Notification from "../components/Notification";

export default function PostRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    fare: string;
    driverName: string;
  }>();
  const { user, updateUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const tipOptions = [100, 200, 500];

  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setNotificationVisible(true);
  };

  useEffect(() => {
    // Provide haptic feedback to confirm the screen has loaded successfully
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showNotification("Payment Successful!");
  }, []);

  const handleFinish = async () => {
    const finalTip = customTip ? parseInt(customTip, 10) : tip;
    let didTip = false;
    if (finalTip > 0 && user && user.walletBalance >= finalTip) {
      await updateUser({ walletBalance: user.walletBalance - finalTip });
      showNotification(`Successfully tipped ₦${finalTip}`);
      console.log(`Tipped: ₦${finalTip}`);
      didTip = true;
    }
    console.log(`Rating: ${rating}`);

    // Delay navigation to allow notification to be seen
    setTimeout(
      () => {
        router.replace("/");
      },
      didTip ? 2300 : 100,
    );
  };

  const handleTipSelect = (amount: number) => {
    setTip(amount);
    setCustomTip("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCustomTipChange = (text: string) => {
    setCustomTip(text);
    setTip(0);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Notification
        message={notificationMessage}
        visible={notificationVisible}
        onDismiss={() => setNotificationVisible(false)}
      />
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Check size={48} color={Colors.white} />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Rate your ride with {params.driverName || "your driver"}.
        </Text>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star
                size={40}
                color={rating >= star ? Colors.primary : Colors.lightGray}
                fill={rating >= star ? Colors.primary : "transparent"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>Add a Tip</Text>
          <View style={styles.tipOptionsContainer}>
            {tipOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.tipOption,
                  tip === option && styles.tipOptionSelected,
                ]}
                onPress={() => handleTipSelect(option)}
              >
                <Text
                  style={[
                    styles.tipOptionText,
                    tip === option && styles.tipOptionTextSelected,
                  ]}
                >
                  ₦{option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.tipInput}
            placeholder="Or enter custom amount"
            keyboardType="numeric"
            value={customTip}
            onChangeText={handleCustomTipChange}
            placeholderTextColor={Colors.gray}
          />
        </View>

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 30,
    textAlign: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 10,
  },
  tipSection: {
    width: "100%",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
    textAlign: "center",
    marginBottom: 16,
  },
  tipOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tipOption: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  tipOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipOptionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark,
  },
  tipOptionTextSelected: {
    color: Colors.white,
  },
  tipInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  finishBtn: {
    width: "100%",
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  finishBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
