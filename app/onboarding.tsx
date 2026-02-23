import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  Camera,
  Lock,
  Check,
  AlertCircle,
  Mail,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import { STUDENT_DATABASE } from "../mocks/data";
import { StudentRecord } from "../types";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    login,
    register,
    verifyOtp,
    resendOtp,
    setPin: setPinOnBackend,
  } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [matric, setMatric] = useState<string>("");
  const [studentInfo, setStudentInfo] = useState<StudentRecord | null>(null);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lookupDone, setLookupDone] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const progressAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const animateProgress = (val: number) => {
    Animated.timing(progressAnim, {
      toValue: val,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleMatricLookup = () => {
    setError("");
    const record = STUDENT_DATABASE[matric.trim()];
    if (!record) {
      setError(
        "Matric number not found in school database. Please check and try again.",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setStudentInfo(record);
    setLookupDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to upload your ID.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
    }
  };

  const goToStep = (nextStep: number) => {
    if (nextStep === 2 && (!lookupDone || !studentInfo)) {
      setError("Please look up your matric number first");
      return;
    }
    if (nextStep === 3 && !idCardImage) {
      setError("Please upload your student ID card photo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setStep(nextStep);
    setError("");
    animateProgress(nextStep * 0.2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSendOtp = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid school email address.");
      return;
    }

    setLoading(true);
    setError("");

    // --- Immediate Actions ---
    // Navigate before waiting for the backend
    goToStep(4);
    setResendCooldown(60);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // --- Background Actions ---
    try {
      // This now runs in the background without blocking the UI
      await register(matric.trim(), "0000", idCardImage, email);
      console.log("Background OTP request sent successfully.");
    } catch (e: unknown) {
      console.error("Background OTP request failed:", e);
      // This error will now appear on the OTP screen, which is helpful.
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError("OTP must be 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      goToStep(5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (pin.length < 4 || pin !== confirmPin) {
      setError("PINs must be 4 digits and match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Step 1: Set the PIN for the verified user.
      await setPinOnBackend(email, pin);

      // Step 2: Log the user in with their matric number and new PIN.
      await login(matric.trim(), pin);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // The AuthProvider will handle the redirect to the main app.
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      await resendOtp(email);
      setResendCooldown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
      animateProgress((step - 1) * 0.2);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step {step} of 5</Text>
          </View>

          <View style={styles.progressWrapper}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0.2, 1],
                    outputRange: ["20%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Let's Find You</Text>
              <Text style={styles.stepDesc}>
                Enter your matriculation number to find your student record.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MATRIC NUMBER</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 123456789"
                    placeholderTextColor={Colors.lightGray}
                    value={matric}
                    onChangeText={setMatric}
                    keyboardType="number-pad"
                    editable={!lookupDone}
                  />
                  <TouchableOpacity
                    style={[
                      styles.lookupBtn,
                      (lookupDone || !matric) && styles.lookupBtnDisabled,
                    ]}
                    onPress={handleMatricLookup}
                    disabled={lookupDone || !matric}
                  >
                    <Search size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {studentInfo && (
                <View style={styles.studentInfoBox}>
                  <Text style={styles.studentName}>{studentInfo.fullName}</Text>
                  <Text style={styles.studentDept}>Matric: {matric}</Text>
                  <Text style={styles.studentDept}>
                    {studentInfo.department}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  (!lookupDone || !studentInfo) && styles.nextBtnDisabled,
                ]}
                onPress={() => goToStep(2)}
                disabled={!lookupDone || !studentInfo}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify Your Identity</Text>
              <Text style={styles.stepDesc}>
                Please upload a clear photo of your student ID card.
              </Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickImage}
              >
                {idCardImage ? (
                  <Image
                    source={{ uri: idCardImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Camera size={40} color={Colors.gray} />
                    <Text style={styles.uploadText}>Tap to upload ID</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, !idCardImage && styles.nextBtnDisabled]}
                onPress={() => goToStep(3)}
                disabled={!idCardImage}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enter Your Email</Text>
              <Text style={styles.stepDesc}>
                A verification code will be sent to your school email address.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SCHOOL EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@school.edu"
                  placeholderTextColor={Colors.lightGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {loading ? "Sending..." : "Send Code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify Your Email</Text>
              <Text style={styles.stepDesc}>
                We've sent a 6-digit code to{" "}
                <Text style={{ fontWeight: "bold" }}>{email}</Text>. Please
                enter it below.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.lightGray}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  testID="otp-input"
                />
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {loading ? "Verifying..." : "Verify"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                <Text
                  style={[
                    styles.resendText,
                    (resendCooldown > 0 || loading) && styles.resendDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Your PIN</Text>
              <Text style={styles.stepDesc}>
                This 4-digit PIN will be used for login and transaction
                approvals.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CREATE 4-DIGIT PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor={Colors.lightGray}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor={Colors.lightGray}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                onPress={handleRegistration}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {loading ? "Completing..." : "Complete Registration"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  backBtn: {
    position: "absolute",
    left: 0,
    padding: 8,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
  },
  progressWrapper: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 24,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  errorBanner: {
    backgroundColor: "#e53935",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  errorText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 15,
    color: Colors.gray,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gray,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  lookupBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  lookupBtnDisabled: {
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
  studentInfoBox: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark,
  },
  studentDept: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadText: {
    marginTop: 8,
    color: Colors.gray,
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  resendDisabled: {
    color: Colors.gray,
  },
});
