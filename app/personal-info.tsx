import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Phone,
  Building,
  GraduationCap,
  Heart,
  BookOpen,
  Pencil,
  Mail,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const editAnim = useRef(new Animated.Value(0)).current;

  const handleEdit = (label: string, value: string) => {
    setEditingField(label);
    setFieldValue(value);
    Animated.timing(editAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = () => {
    if (editingField === "PHONE NUMBER") {
      if (!/^\\d{7,15}$/.test(fieldValue)) {
        setError("Please enter a valid phone number (7-15 digits).");
        return;
      }
    }

    if (editingField === "EMAIL") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    Animated.timing(editAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (editingField) {
        const key =
          editingField === "PHONE NUMBER"
            ? "phoneNumber"
            : editingField === "ACCOUNT BIO"
              ? "bio"
              : editingField === "EMAIL"
                ? "email"
                : null;
        if (key) {
          updateUser({ [key]: fieldValue });
        }
        setEditingField(null);
        setFieldValue("");
        setError(null);
      }
    });
  };

  const handleCancel = () => {
    Animated.timing(editAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setEditingField(null);
      setFieldValue("");
      setError(null);
    });
  };

  const infoItems = [
    {
      icon: User,
      label: "FULL NAME",
      value: user?.fullName ?? "Not set",
      verified: true,
      editable: false,
    },
    {
      icon: ShieldCheck,
      label: "MATRIC NUMBER",
      value: user?.matricNumber ?? "Not set",
      verified: true,
      editable: false,
    },
    {
      icon: Building,
      label: "DEPARTMENT",
      value: user?.department ?? "Not set",
      verified: true,
      editable: false,
    },
    {
      icon: GraduationCap,
      label: "CURRENT LEVEL",
      value: user?.level ?? "Not set",
      verified: true,
      editable: false,
    },
    {
      icon: BookOpen,
      label: "ACCOUNT BIO",
      value: user?.bio ?? "Campus commuting, safer and faster.",
      verified: false,
      editable: true,
    },
    {
      icon: Mail,
      label: "EMAIL",
      value: user?.email ?? "Not set",
      verified: false,
      editable: true,
    },
    {
      icon: Phone,
      label: "PHONE NUMBER",
      value: user?.phoneNumber ?? "Not set",
      verified: false,
      editable: true,
    },
    {
      icon: Heart,
      label: "BLOOD GROUP",
      value: user?.bloodGroup ?? "Not set",
      verified: true,
      editable: false,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Personal Info</Text>
          <Text style={styles.headerSub}>UNIVERSITY VERIFIED IDENTITY</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          {infoItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.infoItem,
                index < infoItems.length - 1 && styles.infoItemBorder,
              ]}
            >
              <View style={styles.infoIcon}>
                <item.icon size={18} color={Colors.gray} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                {editingField === item.label ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={fieldValue}
                      onChangeText={(text) => {
                        setFieldValue(text);
                        if (error) setError(null);
                      }}
                      autoFocus
                      keyboardType={
                        item.label === "PHONE NUMBER"
                          ? "phone-pad"
                          : item.label === "EMAIL"
                            ? "email-address"
                            : "default"
                      }
                    />
                    {error && <Text style={styles.errorText}>{error}</Text>}
                  </>
                ) : (
                  <Text style={styles.infoValue}>{item.value}</Text>
                )}
                {item.verified && (
                  <View style={styles.verifiedRow}>
                    <ShieldCheck size={10} color={Colors.lightGray} />
                    <Text style={styles.verifiedText}>VERIFIED BY PORTAL</Text>
                  </View>
                )}
              </View>
              {item.editable && editingField !== item.label && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEdit(item.label, item.value)}
                >
                  <Pencil size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
              {editingField === item.label && (
                <Animated.View
                  style={[
                    styles.editActions,
                    {
                      opacity: editAnim,
                      transform: [
                        {
                          translateX: editAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleSave}
                  >
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.actionText}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <ShieldCheck size={16} color={Colors.accent} />
          <Text style={styles.noteText}>
            Locked data is synced with your{" "}
            <Text style={styles.noteBold}>Portal Record</Text>. For corrections,
            visit your Faculty Office or use the Portal feedback system.
          </Text>
        </View>
      </ScrollView>
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
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
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
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginTop: 3,
  },
  editInput: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginTop: 3,
    padding: 0,
    margin: 0,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.lightGray,
    letterSpacing: 0.5,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtn: {
    backgroundColor: Colors.lightGray,
  },
  actionText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.accentLight,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F59E0B30",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.darkGray,
    lineHeight: 18,
  },
  noteBold: {
    fontWeight: "700" as const,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
});
