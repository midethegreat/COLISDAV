import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Menu,
  ShieldCheck,
  CreditCard,
  Bitcoin,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  X,
  Wallet,
  Bell,
  Banknote,
  Landmark,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import { MOCK_TRANSACTIONS } from "../mocks/data";
import DrawerMenu from "../components/DrawerMenu";
import { monnifyConfig } from "../constants/env";
import { api } from "../constants/api";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const base64 = {
  decode: (str: string) => {
    try {
      return atob(str);
    } catch (e) {
      console.error("Failed to decode base64 string", e);
      return "";
    }
  },
  encode: (str: string) => {
    try {
      return btoa(str);
    } catch (e) {
      console.error("Failed to encode base64 string", e);
      return "";
    }
  },
};

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showMonnifyModal, setShowMonnifyModal] = useState<boolean>(false);
  const [monnifyAmount, setMonnifyAmount] = useState<string>("");
  const [monnifyProcessing, setMonnifyProcessing] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawProcessing, setWithdrawProcessing] = useState<boolean>(false);
  const [showFlutterwaveModal, setShowFlutterwaveModal] =
    useState<boolean>(false);
  const [flutterwaveAmount, setFlutterwaveAmount] = useState<string>("");
  const [flutterwaveProcessing, setFlutterwaveProcessing] =
    useState<boolean>(false);

  const recentTransactions = MOCK_TRANSACTIONS.slice(0, 4);
  const presetAmounts = [1000, 2000, 5000, 10000];

  const handleMonnifyDeposit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to make a deposit.");
      return;
    }

    if (!user.email) {
      Alert.alert(
        "Update Profile",
        "Please add your email address in your profile before making a deposit.",
      );
      return;
    }

    const numAmount = parseInt(monnifyAmount, 10);
    if (!numAmount || numAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum deposit is ₦100");
      return;
    }
    setMonnifyProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Securely initialize payment via your backend
      const response = await fetch(
        "http://192.168.0.121:3000/api/transactions/initialize-monnify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: numAmount,
            userId: user.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.message || "Failed to initialize payment.");
      }

      const checkoutUrl = data.checkoutUrl;

      // Open Checkout URL - verification is handled by the Linking listener
      setShowMonnifyModal(false);
      setMonnifyAmount("");
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (error) {
      console.error("Monnify Deposit Error:", error);
      Alert.alert(
        "Deposit Failed",
        `Could not initiate the deposit. ${
          error instanceof Error ? error.message : "Please try again."
        }`,
      );
    } finally {
      setMonnifyProcessing(false);
    }
  };

  const handleFlutterwaveDeposit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to make a deposit.");
      return;
    }

    if (!user.email || !user.fullName || !user.phoneNumber) {
      Alert.alert(
        "Update Profile",
        "Please complete your profile (email, full name, phone number) before making a deposit.",
      );
      return;
    }

    const numAmount = parseInt(flutterwaveAmount, 10);
    if (!numAmount || numAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum deposit is ₦100");
      return;
    }
    setFlutterwaveProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch(
        `${api.baseUrl}/transactions/initialize-flutterwave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            amount: numAmount.toString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.link) {
        throw new Error(data.message || "Failed to initialize deposit.");
      }

      // Open the payment link in the browser
      setShowFlutterwaveModal(false);
      setFlutterwaveAmount("");
      await WebBrowser.openBrowserAsync(data.link);
    } catch (error) {
      Alert.alert(
        "Deposit Error",
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setFlutterwaveProcessing(false);
    }
  };

  const verifyMonnifyPayment = useCallback(
    async (transactionReference: string) => {
      if (!user) return;
      setMonnifyProcessing(true); // Show loading indicator
      try {
        const verifyResponse = await fetch(
          "http://192.168.0.121:3000/api/transactions/verify-monnify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionReference, userId: user.id }),
          },
        );

        const verifyData = await verifyResponse.json();

        if (verifyResponse.ok) {
          Alert.alert(
            "Deposit Successful",
            `Your new balance is ₦${verifyData.newBalance}`,
          );
          updateUser({ walletBalance: verifyData.newBalance });
        } else {
          throw new Error(
            verifyData.message || "Failed to verify transaction.",
          );
        }
      } catch (error) {
        console.error("Monnify Verification Error:", error);
        Alert.alert(
          "Verification Failed",
          error instanceof Error ? error.message : "An unknown error occurred.",
        );
      } finally {
        setMonnifyProcessing(false);
      }
    },
    [user, updateUser],
  );

  const verifyFlutterwavePayment = useCallback(
    async (tx_ref: string) => {
      if (!user) return;
      setFlutterwaveProcessing(true); // Show loading indicator
      try {
        const verifyResponse = await fetch(
          `${api.baseUrl}/transactions/verify-flutterwave`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tx_ref, userId: user.id }),
          },
        );

        const verifyData = await verifyResponse.json();

        if (verifyResponse.ok) {
          Alert.alert(
            "Deposit Successful",
            `Your new balance is ₦${verifyData.newBalance}`,
          );
          updateUser({ walletBalance: verifyData.newBalance });
        } else {
          throw new Error(
            verifyData.message || "Failed to verify transaction.",
          );
        }
      } catch (error) {
        console.error("Flutterwave Verification Error:", error);
        Alert.alert(
          "Verification Failed",
          error instanceof Error ? error.message : "An unknown error occurred.",
        );
      } finally {
        setFlutterwaveProcessing(false);
      }
    },
    [user, updateUser],
  );

  useEffect(() => {
    const handleRedirect = (event: { url: string }) => {
      const { queryParams } = Linking.parse(event.url);
      const monnifyRef = queryParams?.transactionReference as string;
      const flutterwaveRef = queryParams?.tx_ref as string;

      if (monnifyRef) {
        verifyMonnifyPayment(monnifyRef);
      } else if (flutterwaveRef) {
        verifyFlutterwavePayment(flutterwaveRef);
      }
    };

    const subscription = Linking.addEventListener("url", handleRedirect);

    return () => {
      subscription.remove();
    };
  }, [verifyMonnifyPayment, verifyFlutterwavePayment]);

  const handleWithdraw = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to make a withdrawal.");
      return;
    }

    const numAmount = parseInt(withdrawAmount, 10);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
      return;
    }

    if (numAmount > (user.walletBalance ?? 0)) {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough balance to withdraw this amount.",
      );
      return;
    }

    setWithdrawProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch(
        "http://192.168.0.121:3000/api/transactions/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: numAmount,
            userId: user.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process withdrawal.");
      }

      updateUser({ walletBalance: user.walletBalance - numAmount });
      Alert.alert(
        "Withdrawal Successful",
        `₦${numAmount} has been withdrawn from your wallet.`,
      );
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal Error:", error);
      Alert.alert(
        "Withdrawal Failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setWithdrawProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setDrawerOpen(true)}
        >
          <Menu size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CID Wallet</Text>
          <Text style={styles.headerSub}>MANAGE YOUR CAMPUS BALANCE</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notifications" as never)}
          style={styles.notificationButton}
        >
          <Bell size={24} color={Colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#1B7A43", "#145C33", "#0D3320"]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>MAIN BALANCE</Text>
          <Text style={styles.balanceAmount}>
            ₦{(user?.walletBalance ?? 5000).toLocaleString()}
          </Text>
          <View style={styles.secureRow}>
            <ShieldCheck size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.secureText}>SECURE CID FINANCIAL IN</Text>
          </View>
        </LinearGradient>

        <View style={styles.depositRow}>
          <TouchableOpacity
            style={styles.depositCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMonnifyModal(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.depositIcon,
                { backgroundColor: Colors.primaryLight },
              ]}
            >
              <CreditCard size={24} color={Colors.primary} />
            </View>
            <Text style={styles.depositLabel}>MONNIFY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.depositCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFlutterwaveModal(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.depositIcon,
                { backgroundColor: Colors.accentLight },
              ]}
            >
              <Landmark size={24} color={Colors.accent} />
            </View>
            <Text style={styles.depositLabel}>FLUTTERWAVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.depositCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/crypto-deposit" as never);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.depositIcon,
                { backgroundColor: Colors.accentLight },
              ]}
            >
              <Bitcoin size={24} color={Colors.accent} />
            </View>
            <Text style={styles.depositLabel}>CRYPTO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.depositCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowWithdrawModal(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.depositIcon, { backgroundColor: Colors.redLight }]}
            >
              <Banknote size={24} color={Colors.red} />
            </View>
            <Text style={styles.depositLabel}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          <TouchableOpacity onPress={() => router.push("/activity" as never)}>
            <Text style={styles.seeAll}>SEE ALL {">"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionList}>
          {recentTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/activity" as never);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.txIcon,
                  tx.isCredit ? styles.txIconCredit : styles.txIconDebit,
                ]}
              >
                {tx.isCredit ? (
                  <ArrowDownLeft size={18} color={Colors.primary} />
                ) : (
                  <ArrowUpRight size={18} color={Colors.red} />
                )}
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                {tx.status === "void" && (
                  <Text style={styles.txVoid}>VOID</Text>
                )}
                {tx.type === "topup" && tx.isCredit && (
                  <Text style={styles.txSubtext}>YES</Text>
                )}
              </View>
              <Text
                style={[
                  styles.txAmount,
                  tx.isCredit ? styles.txAmountCredit : styles.txAmountDebit,
                ]}
              >
                {tx.isCredit ? "+" : ""}₦{tx.amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/activity" as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionText}>Transaction History</Text>
            <ChevronRight size={18} color={Colors.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/ride-history" as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionText}>Ride History</Text>
            <ChevronRight size={18} color={Colors.gray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.monnifySheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.monnifyHeader}>
              <View>
                <Text style={styles.monnifyTitle}>Withdraw Funds</Text>
                <Text style={styles.monnifySub}>TRANSFER TO YOUR BANK</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                }}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.amountLabel}>ENTER AMOUNT (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.lightGray}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="number-pad"
            />

            <View style={styles.presetRow}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    withdrawAmount === preset.toString() &&
                      styles.presetBtnActive,
                  ]}
                  onPress={() => setWithdrawAmount(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      withdrawAmount === preset.toString() &&
                        styles.presetTextActive,
                    ]}
                  >
                    ₦{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!withdrawAmount || withdrawProcessing) &&
                  styles.proceedBtnDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={!withdrawAmount || withdrawProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedBtnText}>
                {withdrawProcessing
                  ? "Processing..."
                  : `Withdraw ₦${parseInt(withdrawAmount || "0", 10).toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showMonnifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.monnifySheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.monnifyHeader}>
              <View>
                <Text style={styles.monnifyTitle}>Deposit via Monnify</Text>
                <Text style={styles.monnifySub}>SECURE PAYMENT GATEWAY</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowMonnifyModal(false);
                  setMonnifyAmount("");
                }}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.amountLabel}>ENTER AMOUNT (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.lightGray}
              value={monnifyAmount}
              onChangeText={setMonnifyAmount}
              keyboardType="number-pad"
            />

            <View style={styles.presetRow}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    monnifyAmount === preset.toString() &&
                      styles.presetBtnActive,
                  ]}
                  onPress={() => setMonnifyAmount(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      monnifyAmount === preset.toString() &&
                        styles.presetTextActive,
                    ]}
                  >
                    ₦{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.monnifyInfo}>
              <Wallet size={18} color={Colors.primary} />
              <Text style={styles.monnifyInfoText}>
                You'll be redirected to Monnify's secure payment page to
                complete this transaction.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!monnifyAmount || monnifyProcessing) &&
                  styles.proceedBtnDisabled,
              ]}
              onPress={handleMonnifyDeposit}
              disabled={!monnifyAmount || monnifyProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedBtnText}>
                {monnifyProcessing
                  ? "Processing..."
                  : `Proceed to Monnify${monnifyAmount ? ` • ₦${parseInt(monnifyAmount || "0", 10).toLocaleString()}` : ""}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFlutterwaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.monnifySheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.monnifyHeader}>
              <View>
                <Text style={styles.monnifyTitle}>Deposit via Flutterwave</Text>
                <Text style={styles.monnifySub}>SECURE PAYMENT GATEWAY</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowFlutterwaveModal(false);
                  setFlutterwaveAmount("");
                }}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.amountLabel}>ENTER AMOUNT (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.lightGray}
              value={flutterwaveAmount}
              onChangeText={setFlutterwaveAmount}
              keyboardType="number-pad"
            />

            <View style={styles.presetRow}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    flutterwaveAmount === preset.toString() &&
                      styles.presetBtnActive,
                  ]}
                  onPress={() => setFlutterwaveAmount(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      flutterwaveAmount === preset.toString() &&
                        styles.presetTextActive,
                    ]}
                  >
                    ₦{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.monnifyInfo}>
              <Wallet size={18} color={Colors.primary} />
              <Text style={styles.monnifyInfoText}>
                You'll be redirected to Flutterwave's secure payment page to
                complete this transaction.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!flutterwaveAmount || flutterwaveProcessing) &&
                  styles.proceedBtnDisabled,
              ]}
              onPress={handleFlutterwaveDeposit}
              disabled={!flutterwaveAmount || flutterwaveProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedBtnText}>
                {flutterwaveProcessing
                  ? "Processing..."
                  : `Proceed to Flutterwave${
                      flutterwaveAmount
                        ? ` • ₦${parseInt(
                            flutterwaveAmount || "0",
                            10,
                          ).toLocaleString()}`
                        : ""
                    }`}
              </Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  headerCenter: {
    alignItems: "center",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.gray,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "800" as const,
    color: Colors.white,
    marginTop: 8,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  secureText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  depositRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 28,
  },
  depositCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    aspectRatio: 1,
  },
  depositIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  depositLabel: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  transactionList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  txIconCredit: {
    backgroundColor: Colors.greenLight,
  },
  txIconDebit: {
    backgroundColor: Colors.redLight,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  txVoid: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.lightGray,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  txSubtext: {
    fontSize: 10,
    color: Colors.lightGray,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  txAmountCredit: {
    color: Colors.green,
  },
  txAmountDebit: {
    color: Colors.red,
  },
  quickActions: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  monnifySheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  monnifyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  monnifyTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  monnifySub: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  amountInput: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 14,
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.dark,
    textAlign: "center" as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  presetBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  presetText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.gray,
  },
  presetTextActive: {
    color: Colors.primary,
  },
  monnifyInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  monnifyInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.darkGray,
    lineHeight: 19,
  },
  proceedBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  proceedBtnDisabled: {
    opacity: 0.5,
  },
  proceedBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
