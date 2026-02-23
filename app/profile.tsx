import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Image,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Menu,
  User,
  Phone,
  Shield,
  EyeOff,
  Lock,
  ShieldCheck,
  ChevronRight,
  Trash2,
  X,
  Mail,
  Smartphone,
  Camera,
  Download,
  AlertTriangle,
  CreditCard,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import DrawerMenu from "../components/DrawerMenu";
import * as ImagePicker from "expo-image-picker";

const DELETE_REASONS = [
  "Privacy concerns",
  "No longer needed",
  "Switching apps",
  "Technical issues",
  "Other",
];

type DeleteStep = "reason" | "confirm" | "pin";
type TwoFAStep = "idle" | "selectMethod" | "enterCode";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, deleteAccount, logout, updateUser, toggle2FA } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("reason");
  const [deletePin, setDeletePin] = useState<string>("");
  const [deletePinError, setDeletePinError] = useState<string>("");

  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [twoFAMethod, setTwoFAMethod] = useState<"email" | "phone">("email");
  const [twoFACode, setTwoFACode] = useState<string>("");
  const [showTwoFAModal, setShowTwoFAModal] = useState<boolean>(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(
    user?.isTwoFactorEnabled ?? false,
  );
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyName, setEmergencyName] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");
  const [emergencyRelation, setEmergencyRelation] = useState<string>("");
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const handleProfileImageChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your photos to let you choose a profile picture.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await updateUser({ profileImage: result.assets[0].uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("Image picker error:", e);
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  const handleToggleTwoFA = async (value: boolean) => {
    if (value) {
      // Start the process to enable 2FA
      setTwoFAStep("selectMethod");
      setShowTwoFAModal(true);
      setTwoFACode("");
    } else {
      // Directly disable 2FA
      setTwoFALoading(true);
      try {
        await toggle2FA(false);
        setIs2FAEnabled(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "2FA Disabled",
          "Two-factor authentication has been turned off.",
        );
      } catch (error) {
        Alert.alert("Error", "Could not disable 2FA. Please try again.");
      } finally {
        setTwoFALoading(false);
      }
    }
  };

  const handleSendTwoFACode = async () => {
    setTwoFALoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        "http://192.168.0.121:3000/api/2fa/send-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, method: twoFAMethod }),
        },
      );

      if (!response.ok) throw new Error("Failed to send code.");

      setTwoFAStep("enterCode");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const destination =
        twoFAMethod === "email" ? user?.email : user?.phoneNumber;
      Alert.alert(
        "Code Sent",
        `A 6-digit verification code has been sent to ${destination}`,
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not send verification code. Please try again.",
      );
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerifyTwoFACode = async () => {
    if (twoFACode.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the 6-digit verification code.",
      );
      return;
    }
    setTwoFALoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        "http://192.168.0.121:3000/api/2fa/verify-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, code: twoFACode }),
        },
      );

      if (!response.ok) throw new Error("Invalid verification code.");

      await toggle2FA(true, twoFAMethod);
      setIs2FAEnabled(true);
      setShowTwoFAModal(false);
      setTwoFAStep("idle");
      setTwoFACode("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "2FA Enabled",
        "Two-factor authentication is now active on your account.",
      );
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        "The code you entered is incorrect or has expired.",
      );
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === "reason") {
      if (!selectedReason) return;
      setDeleteStep("confirm");
      return;
    }
    if (deleteStep === "confirm") {
      setDeleteStep("pin");
      setDeletePin("");
      setDeletePinError("");
      return;
    }
    if (deleteStep === "pin") {
      if (deletePin.length !== 4) {
        setDeletePinError("PIN must be 4 digits");
        return;
      }
      if (user?.pin && deletePin !== user.pin) {
        setDeletePinError("Incorrect PIN. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowDeleteModal(false);
      setDeleteStep("reason");
      setSelectedReason("");
      setDeletePin("");
      await deleteAccount();
      router.replace("/welcome" as never);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep("reason");
    setSelectedReason("");
    setDeletePin("");
    setDeletePinError("");
  };

  const handleSaveEmergencyContact = () => {
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      Alert.alert("Required", "Please fill in name and phone number.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEmergencyModal(false);
    Alert.alert("Saved", "Emergency contact has been saved successfully.");
  };

  const handleDownloadData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Data Export",
      "Your personal data export has been prepared. A download link will be sent to your registered email.",
      [{ text: "OK" }],
    );
    setShowPrivacyModal(false);
  };

  const handleAccountItemPress = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (title === "Personal Information") {
      router.push("/personal-info" as never);
    } else if (title === "Bank Account") {
      router.push("/bank-account" as never);
    } else if (title === "Emergency Contact") {
      setShowEmergencyModal(true);
    } else if (title === "Safety") {
      setShowSafetyModal(true);
    } else if (title === "Privacy") {
      setShowPrivacyModal(true);
    }
  };

  const accountItems = [
    {
      icon: User,
      iconBg: Colors.primaryLight,
      iconColor: Colors.primary,
      title: "Personal Information",
      subtitle: "EDIT IDENTITY DETAILS",
    },
    {
      icon: CreditCard,
      iconBg: "#E0E7FF",
      iconColor: "#6366F1",
      title: "Bank Account",
      subtitle: "MANAGE YOUR BANK ACCOUNT",
    },
    {
      icon: Phone,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      title: "Emergency Contact",
      subtitle: "SAFETY CONTACTS & SOS",
    },
    {
      icon: Shield,
      iconBg: Colors.greenLight,
      iconColor: Colors.green,
      title: "Safety",
      subtitle: "TRUST & SECURITY TOOLS",
    },
    {
      icon: EyeOff,
      iconBg: "#E0E7FF",
      iconColor: "#6366F1",
      title: "Privacy",
      subtitle: "DATA & PERMISSIONS",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setDrawerOpen(true)}
        >
          <Menu size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSub}>PORTAL ACCOUNT MANAGEMENT</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={handleProfileImageChange}
            activeOpacity={0.7}
          >
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user?.fullName?.charAt(0) ?? "U"}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Camera size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName ?? "Student"}</Text>
            <Text style={styles.userMeta}>
              {user?.matricNumber ?? ""} • STUDENT
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          {accountItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < accountItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleAccountItemPress(item.title)}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                <item.icon size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={Colors.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/pin-settings" as never);
            }}
            activeOpacity={0.6}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: Colors.background }]}
            >
              <Lock size={20} color={Colors.gray} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Security PIN</Text>
              <Text style={styles.menuSubtitle}>APP ACCESS & PAYMENTS</Text>
            </View>
            <Text style={styles.updateLabel}>UPDATE</Text>
            <ChevronRight size={18} color={Colors.lightGray} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View
              style={[styles.menuIcon, { backgroundColor: Colors.background }]}
            >
              <ShieldCheck size={20} color={Colors.gray} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Two-Factor Auth</Text>
              <Text style={styles.menuSubtitle}>
                {is2FAEnabled
                  ? `ENABLED VIA ${user?.twoFactorMethod?.toUpperCase()}`
                  : "DISABLED"}
              </Text>
            </View>
            <Switch
              value={is2FAEnabled}
              onValueChange={handleToggleTwoFA}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={is2FAEnabled ? Colors.primary : Colors.lightGray}
              disabled={twoFALoading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteCard}
          onPress={() => setShowDeleteModal(true)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color={Colors.red} />
          <Text style={styles.deleteText}>Delete Account</Text>
          <ChevronRight size={18} color={Colors.red} />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showTwoFAModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.twoFAModal}>
            <View style={styles.twoFAModalHeader}>
              <Text style={styles.twoFAModalTitle}>
                {twoFAStep === "selectMethod"
                  ? "Verify Your Identity"
                  : "Enter Verification Code"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTwoFAModal(false);
                  setTwoFAStep("idle");
                  setTwoFACode("");
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {twoFAStep === "selectMethod" && (
              <>
                <Text style={styles.twoFADesc}>
                  A verification code will be sent to confirm your identity
                  before enabling 2FA.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.twoFAMethodBtn,
                    twoFAMethod === "email" && styles.twoFAMethodActive,
                  ]}
                  onPress={() => setTwoFAMethod("email")}
                >
                  <Mail
                    size={20}
                    color={
                      twoFAMethod === "email" ? Colors.primary : Colors.gray
                    }
                  />
                  <View style={styles.twoFAMethodInfo}>
                    <Text
                      style={[
                        styles.twoFAMethodTitle,
                        twoFAMethod === "email" &&
                          styles.twoFAMethodTitleActive,
                      ]}
                    >
                      Email
                    </Text>
                    <Text style={styles.twoFAMethodSub}>
                      {user?.email ?? "No email provided"}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.twoFAMethodBtn,
                    twoFAMethod === "phone" && styles.twoFAMethodActive,
                  ]}
                  onPress={() => setTwoFAMethod("phone")}
                  disabled={!user?.phoneNumber}
                >
                  <Smartphone
                    size={20}
                    color={
                      twoFAMethod === "phone" ? Colors.primary : Colors.gray
                    }
                  />
                  <View style={styles.twoFAMethodInfo}>
                    <Text
                      style={[
                        styles.twoFAMethodTitle,
                        twoFAMethod === "phone" &&
                          styles.twoFAMethodTitleActive,
                      ]}
                    >
                      Phone
                    </Text>
                    <Text style={styles.twoFAMethodSub}>
                      {user?.phoneNumber ?? "No phone provided"}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.twoFASendBtn,
                    twoFALoading && styles.twoFASendBtnDisabled,
                  ]}
                  onPress={handleSendTwoFACode}
                  activeOpacity={0.85}
                  disabled={twoFALoading}
                >
                  <Text style={styles.twoFASendBtnText}>
                    {twoFALoading ? "Sending..." : "Send Code"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {twoFAStep === "enterCode" && (
              <>
                <Text style={styles.twoFADesc}>
                  Enter the 6-digit code sent to your{" "}
                  {twoFAMethod === "email" ? "email" : "phone number"}.
                </Text>
                <TextInput
                  style={styles.twoFACodeInput}
                  placeholder="000000"
                  placeholderTextColor={Colors.lightGray}
                  value={twoFACode}
                  onChangeText={setTwoFACode}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[
                    styles.twoFASendBtn,
                    twoFALoading && styles.twoFASendBtnDisabled,
                  ]}
                  onPress={handleVerifyTwoFACode}
                  activeOpacity={0.85}
                  disabled={twoFALoading}
                >
                  <Text style={styles.twoFASendBtnText}>
                    {twoFALoading ? "Verifying..." : "Verify & Enable 2FA"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleSendTwoFACode}
                  disabled={twoFALoading}
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            {deleteStep === "reason" && (
              <>
                <Text style={styles.deleteModalTitle}>
                  Why are you leaving?
                </Text>
                {DELETE_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonItem,
                      selectedReason === reason && styles.reasonItemActive,
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason && styles.reasonTextActive,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.deleteModalActions}>
                  <TouchableOpacity
                    style={[
                      styles.deleteConfirmBtn,
                      !selectedReason && styles.deleteBtnDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={!selectedReason}
                  >
                    <Text style={styles.deleteConfirmText}>Continue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={resetDeleteModal}
                  >
                    <Text style={styles.cancelText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {deleteStep === "confirm" && (
              <>
                <View style={styles.confirmIconWrap}>
                  <Trash2 size={32} color={Colors.red} />
                </View>
                <Text style={styles.deleteModalTitle}>Are you sure?</Text>
                <Text style={styles.confirmDesc}>
                  This action is permanent and cannot be undone. All your data,
                  ride history, and wallet balance will be permanently deleted.
                </Text>
                <View style={styles.deleteModalActions}>
                  <TouchableOpacity
                    style={styles.deleteConfirmBtn}
                    onPress={handleDeleteAccount}
                  >
                    <Text style={styles.deleteConfirmText}>
                      Yes, Delete My Account
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={resetDeleteModal}
                  >
                    <Text style={styles.cancelText}>NO, KEEP MY ACCOUNT</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {deleteStep === "pin" && (
              <>
                <View style={styles.confirmIconWrap}>
                  <Lock size={32} color={Colors.red} />
                </View>
                <Text style={styles.deleteModalTitle}>Enter Your PIN</Text>
                <Text style={styles.confirmDesc}>
                  For security, enter your 4-digit app PIN to confirm account
                  deletion.
                </Text>
                <TextInput
                  style={styles.pinInput}
                  placeholder="• • • •"
                  placeholderTextColor={Colors.lightGray}
                  value={deletePin}
                  onChangeText={(t) => {
                    setDeletePin(t);
                    setDeletePinError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  textAlign="center"
                />
                {deletePinError ? (
                  <Text style={styles.pinError}>{deletePinError}</Text>
                ) : null}
                <View style={styles.deleteModalActions}>
                  <TouchableOpacity
                    style={styles.deleteConfirmBtn}
                    onPress={handleDeleteAccount}
                  >
                    <Text style={styles.deleteConfirmText}>
                      Confirm Deletion
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={resetDeleteModal}
                  >
                    <Text style={styles.cancelText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showEmergencyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.emergencyModal}>
            <View style={styles.twoFAModalHeader}>
              <Text style={styles.twoFAModalTitle}>Emergency Contact</Text>
              <TouchableOpacity
                onPress={() => setShowEmergencyModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.twoFADesc}>
              Add someone who can be contacted in case of an emergency during
              your rides.
            </Text>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.emergencyInput}
              placeholder="e.g. Mrs. Adekunle"
              placeholderTextColor={Colors.lightGray}
              value={emergencyName}
              onChangeText={setEmergencyName}
            />
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.emergencyInput}
              placeholder="+234 XXX XXX XXXX"
              placeholderTextColor={Colors.lightGray}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>RELATIONSHIP</Text>
            <TextInput
              style={styles.emergencyInput}
              placeholder="e.g. Mother, Father, Guardian"
              placeholderTextColor={Colors.lightGray}
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
            />
            <TouchableOpacity
              style={styles.twoFASendBtn}
              onPress={handleSaveEmergencyContact}
              activeOpacity={0.85}
            >
              <Text style={styles.twoFASendBtnText}>
                Save Emergency Contact
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSafetyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.safetyModal}>
            <View style={styles.twoFAModalHeader}>
              <Text style={styles.twoFAModalTitle}>Safety Protocols</Text>
              <TouchableOpacity
                onPress={() => setShowSafetyModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.safetySection}>
                <View style={styles.safetyIconRow}>
                  <ShieldCheck size={20} color={Colors.primary} />
                  <Text style={styles.safetySectionTitle}>Ride Safety</Text>
                </View>
                <Text style={styles.safetyText}>
                  {"\u2022"} Always verify the driver's identity and plate
                  number before boarding.{"\n"}
                  {"\u2022"} Share your ride details with a trusted contact.
                  {"\n"}
                  {"\u2022"} Use the in-app confirmation code to verify your
                  driver.{"\n"}
                  {"\u2022"} Do not board a keke that appears overcrowded or
                  unsafe.{"\n"}
                  {"\u2022"} Sit in a position where you can easily exit the
                  vehicle.
                </Text>
              </View>

              <View style={styles.safetySection}>
                <View style={styles.safetyIconRow}>
                  <AlertTriangle size={20} color={Colors.accent} />
                  <Text style={styles.safetySectionTitle}>
                    Emergency Procedures
                  </Text>
                </View>
                <Text style={styles.safetyText}>
                  {"\u2022"} In case of an emergency, use the SOS button in the
                  app.{"\n"}
                  {"\u2022"} The app will automatically notify your emergency
                  contact.{"\n"}
                  {"\u2022"} Campus security will be alerted with your live
                  location.{"\n"}
                  {"\u2022"} Stay calm and follow instructions from security
                  personnel.{"\n"}
                  {"\u2022"} Emergency hotline: 0803-XXX-XXXX (FUNAAB Security)
                </Text>
              </View>

              <View style={styles.safetySection}>
                <View style={styles.safetyIconRow}>
                  <Shield size={20} color={Colors.green} />
                  <Text style={styles.safetySectionTitle}>
                    Account Security
                  </Text>
                </View>
                <Text style={styles.safetyText}>
                  {"\u2022"} Never share your PIN or password with anyone.{"\n"}
                  {"\u2022"} Enable Two-Factor Authentication (2FA) for extra
                  security.{"\n"}
                  {"\u2022"} Report any suspicious activity on your account
                  immediately.{"\n"}
                  {"\u2022"} Regularly update your PIN and review login
                  activity.{"\n"}
                  {"\u2022"} Log out from shared devices after use.
                </Text>
              </View>

              <View style={styles.safetySection}>
                <View style={styles.safetyIconRow}>
                  <User size={20} color={"#6366F1"} />
                  <Text style={styles.safetySectionTitle}>
                    Driver Verification
                  </Text>
                </View>
                <Text style={styles.safetyText}>
                  {"\u2022"} All drivers are verified with valid ID and vehicle
                  documents.{"\n"}
                  {"\u2022"} Drivers undergo background checks before
                  activation.{"\n"}
                  {"\u2022"} Rate your driver after every ride to help maintain
                  quality.{"\n"}
                  {"\u2022"} Report any misconduct through the app's support
                  channel.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.twoFASendBtn}
                onPress={() => setShowSafetyModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.twoFASendBtnText}>Got It</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.privacyModal}>
            <View style={styles.twoFAModalHeader}>
              <Text style={styles.twoFAModalTitle}>Privacy & Data</Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.twoFADesc}>
              You have the right to access and download all personal data we
              store about you.
            </Text>

            <View style={styles.privacyItem}>
              <View style={styles.privacyItemLeft}>
                <Text style={styles.privacyItemTitle}>
                  Personal Information
                </Text>
                <Text style={styles.privacyItemSub}>
                  Name, matric number, department, phone
                </Text>
              </View>
            </View>
            <View style={styles.privacyItem}>
              <View style={styles.privacyItemLeft}>
                <Text style={styles.privacyItemTitle}>Ride History</Text>
                <Text style={styles.privacyItemSub}>
                  All past rides, locations, and receipts
                </Text>
              </View>
            </View>
            <View style={styles.privacyItem}>
              <View style={styles.privacyItemLeft}>
                <Text style={styles.privacyItemTitle}>Transaction Data</Text>
                <Text style={styles.privacyItemSub}>
                  Wallet transactions, payments, and deposits
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadDataBtn}
              onPress={handleDownloadData}
              activeOpacity={0.85}
            >
              <Download size={18} color={Colors.white} />
              <Text style={styles.twoFASendBtnText}>Download My Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
    paddingLeft: 60,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
    paddingLeft: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  userMeta: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  menuSubtitle: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.lightGray,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  updateLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.3,
    marginRight: 4,
  },
  deleteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.redLight,
    padding: 18,
    borderRadius: 16,
    marginTop: 4,
  },
  deleteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.dark,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  confirmIconWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.redLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center" as const,
    lineHeight: 21,
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.dark,
    textAlign: "center" as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    letterSpacing: 12,
  },
  pinError: {
    fontSize: 12,
    color: Colors.red,
    textAlign: "center" as const,
    marginBottom: 12,
  },
  reasonItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  reasonItemActive: {
    backgroundColor: Colors.redLight,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.dark,
  },
  reasonTextActive: {
    color: Colors.red,
    fontWeight: "600" as const,
  },
  deleteModalActions: {
    marginTop: 20,
    gap: 12,
  },
  deleteConfirmBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.lightGray,
    letterSpacing: 0.5,
  },
  twoFAModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
  },
  twoFAModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  twoFAModalTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  twoFADesc: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 21,
    marginBottom: 20,
  },
  twoFAMethodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  twoFAMethodActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  twoFAMethodInfo: {
    flex: 1,
  },
  twoFAMethodTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  twoFAMethodTitleActive: {
    color: Colors.primary,
  },
  twoFAMethodSub: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  twoFASendBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  twoFASendBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  twoFASendBtnDisabled: {
    opacity: 0.6,
  },
  twoFACodeInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 8,
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  emergencyModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  emergencyInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  safetyModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
  },
  safetySection: {
    marginBottom: 20,
  },
  safetyIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  safetySectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  safetyText: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 22,
  },
  privacyModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  privacyItemLeft: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  privacyItemSub: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  downloadDataBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
});
