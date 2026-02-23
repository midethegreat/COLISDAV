import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Star, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "../constants/color";
import { api } from "../constants/api"; // We will create this file next

interface RatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  rideId: string;
  driverName: string;
  fare: number;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isVisible,
  onClose,
  rideId,
  driverName,
  fare,
}) => {
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState("");

  const handleStarPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please select a star rating before submitting.",
      );
      return;
    }

    const tipAmount = parseFloat(tip) || 0;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // IMPORTANT: Replace with your actual API endpoint
      const response = await fetch(`${api.baseUrl}/api/rides/${rideId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          tip: tipAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating.");
      }

      Alert.alert("Feedback Submitted", "Thank you for rating your driver!");
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Could not submit your feedback. Please try again.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.gray} />
          </TouchableOpacity>

          <Text style={styles.title}>Rate Your Ride</Text>
          <Text style={styles.driverName}>with {driverName}</Text>

          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleStarPress(index)}
              >
                <Star
                  size={36}
                  color={index < rating ? Colors.yellow : Colors.lightGray}
                  fill={index < rating ? Colors.yellow : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.tipTitle}>Add a Tip (Optional)</Text>
          <Text style={styles.fareText}>
            Your ride fare was ₦{fare.toFixed(2)}
          </Text>
          <TextInput
            style={styles.tipInput}
            placeholder="Enter tip amount"
            keyboardType="numeric"
            value={tip}
            onChangeText={setTip}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.dark,
  },
  driverName: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
    width: "80%",
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark,
    marginBottom: 8,
  },
  fareText: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 15,
  },
  tipInput: {
    height: 50,
    width: "100%",
    borderColor: Colors.lightGray,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 25,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    width: "100%",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

export default RatingModal;
