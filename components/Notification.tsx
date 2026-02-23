import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { CheckCircle } from "lucide-react-native";
import Colors from "../constants/color";

interface NotificationProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  visible,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onDismiss);
        }, 2000);
      });
    }
  }, [visible, fadeAnim, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <CheckCircle size={24} color={Colors.white} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: Colors.green,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
  },
  message: {
    color: Colors.white,
    marginLeft: 10,
    fontSize: 16,
  },
});

export default Notification;
