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
  Clock,
  Wallet,
  Bell,
  Banknote,
  Landmark,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";
import DrawerMenu from "../components/DrawerMenu";

import { api } from "../constants/api";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Header from "../components/Header";

type Transaction = {
  id: string;
  title: string;
  amount: number;
  isCredit: boolean;
  type: string;
  status: "success" | "pending" | "failed" | "void";
  createdAt: string;
};

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
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawProcessing, setWithdrawProcessing] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositProcessing, setDepositProcessing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const presetAmounts = [1000, 2000, 5000, 10000];

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${api.baseUrl}/transactions/${user.id}`);
        const data = await response.json();
        if (response.ok) {
          setTransactions(data);
        } else {
          throw new Error(data.message || "Failed to fetch transactions.");
        }
      } catch (error) {
        console.error("Fetch Transactions Error:", error);
        Alert.alert(
          "Error",
          "Could not fetch transaction history. Please try again.",
        );
      }
    };

    fetchTransactions();
  }, [user]);

  const handleDeposit = async () => {
    console.log("User object in handleDeposit:", user);
    if (!user) {
      Alert.alert("Error", "You must be logged in to make a deposit.");
      return;
    }

    // This check ensures the user's profile is complete
    if (!user.email || !user.fullName || !user.phoneNumber) {
      Alert.alert(
        "Update Profile",
        "Please complete your profile (email, full name, phone number) before making a deposit.",
      );
      return;
    }

    const numAmount = parseInt(depositAmount, 10);
    if (!numAmount || numAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum deposit is ₦100");
      return;
    }
    setDepositProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // The user's details are sent to the backend here
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
            redirectUrl: Linking.createURL("wallet"),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.link) {
        throw new Error(data.message || "Failed to initialize deposit.");
      }

      // Open the payment link in the browser
      setShowDepositModal(false);
      setDepositAmount("");
      await WebBrowser.openBrowserAsync(data.link);
    } catch (error) {
      Alert.alert(
        "Deposit Error",
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setDepositProcessing(false);
    }
  };

  const verifyDeposit = useCallback(
    async (tx_ref: string, transaction_id: string) => {
      if (!user) return;
      console.log(
        `[VERIFYING DEPOSIT] tx_ref: ${tx_ref}, transaction_id: ${transaction_id}`,
      );
      setDepositProcessing(true); // Show loading indicator
      try {
        const verifyResponse = await fetch(
          `${api.baseUrl}/transactions/verify-flutterwave`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tx_ref, transaction_id, userId: user.id }),
          },
        );

        // Log raw response text for debugging
        const responseText = await verifyResponse.text();
        console.log("[VERIFY RESPONSE TEXT]", responseText);

        const verifyData = JSON.parse(responseText);
        console.log("[VERIFY RESPONSE JSON]", verifyData);

        if (verifyResponse.ok) {
          Alert.alert(
            "Deposit Successful",
            `Your new balance is ₦${verifyData.newBalance}`,
          );
          updateUser({ walletBalance: verifyData.newBalance });
          // Manually refetch transactions to update the list
          fetchTransactions();
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
        setDepositProcessing(false);
      }
    },
    [user, updateUser],
  );

  useEffect(() => {
    const handleRedirect = (url: string | null) => {
      if (!url) return;

      console.log("[DEEP LINK RECEIVED]", url);
      const { queryParams } = Linking.parse(url);
      console.log("[PARSED QUERY PARAMS]", queryParams);

      const tx_ref = queryParams?.tx_ref as string;
      const transaction_id = queryParams?.transaction_id as string;
      const status = queryParams?.status as string;

      if (status === "cancelled") {
        Alert.alert("Payment Cancelled", "You cancelled the deposit process.");
        return;
      }

      if (tx_ref && transaction_id) {
        verifyDeposit(tx_ref, transaction_id);
      } else {
        console.log(
          "[MISSING PARAMS] tx_ref or transaction_id not found in URL.",
        );
      }
    };

    // Handle initial URL (app opened from a deep link)
    Linking.getInitialURL().then(handleRedirect);

    // Handle subsequent URLs (app already open)
    const subscription = Linking.addEventListener("url", (event) =>
      handleRedirect(event.url),
    );

    return () => {
      subscription.remove();
    };
  }, [verifyDeposit]);

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
      <Header
        title="CID Wallet"
        subtitle="MANAGE YOUR CAMPUS BALANCE"
        onMenuPress={() => setDrawerOpen(true)}
      />

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
            ₦{(user?.walletBalance ?? 0).toLocaleString()}
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
              setShowDepositModal(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.depositIcon,
                { backgroundColor: Colors.primaryLight },
              ]}
            >
              <Landmark size={24} color={Colors.primary} />
            </View>
            <Text style={styles.depositLabel}>DEPOSIT</Text>
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
          {transactions.slice(0, 4).map((tx) => {
            const isCredit =
              tx.type.toLowerCase() === "deposit" ||
              tx.type.toLowerCase() === "topup";
            const title = isCredit ? "Deposit" : tx.title;

            // Determine color and icon based on status
            const isSuccess = tx.status === "success";
            const isFailed = tx.status === "failed" || tx.status === "void";
            const isPending = tx.status === "pending";

            const statusColor = isSuccess
              ? Colors.primary
              : isFailed
                ? Colors.red
                : isPending
                  ? Colors.accent
                  : Colors.gray;

            const iconBackgroundColor = isSuccess
              ? Colors.primaryLight
              : isFailed
                ? Colors.redLight
                : isPending
                  ? Colors.accentLight
                  : Colors.lightGray;

            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.txCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/receipt",
                    params: {
                      txId: tx.id,
                      fare: tx.amount.toString(),
                      amount: tx.amount.toString(),
                      date: tx.createdAt,
                      status: tx.status,
                      type: isCredit ? "deposit" : tx.type,
                      pickup: "N/A",
                      destination: tx.title,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.txCardLeft}>
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: iconBackgroundColor },
                    ]}
                  >
                    {isPending ? (
                      <Clock size={20} color={statusColor} />
                    ) : isCredit ? (
                      <ArrowDownLeft size={20} color={statusColor} />
                    ) : (
                      <ArrowUpRight size={20} color={statusColor} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{title}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.txCardRight}>
                  <Text style={[{ color: statusColor }, styles.txAmount]}>
                    {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.txStatus,
                      styles[
                        `txStatus${
                          tx.status.charAt(0).toUpperCase() + tx.status.slice(1)
                        }`
                      ],
                    ]}
                  >
                    {tx.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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

      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.monnifySheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.monnifyHeader}>
              <View>
                <Text style={styles.monnifyTitle}>Deposit Funds</Text>
                <Text style={styles.monnifySub}>SECURE PAYMENT GATEWAY</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowDepositModal(false);
                  setDepositAmount("");
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
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="number-pad"
            />

            <View style={styles.presetRow}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    depositAmount === preset.toString() &&
                      styles.presetBtnActive,
                  ]}
                  onPress={() => setDepositAmount(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      depositAmount === preset.toString() &&
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
                You'll be redirected to a secure payment page to complete this
                transaction.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!depositAmount || depositProcessing) &&
                  styles.proceedBtnDisabled,
              ]}
              onPress={handleDeposit}
              disabled={!depositAmount || depositProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedBtnText}>
                {depositProcessing
                  ? "Processing..."
                  : `Proceed to Deposit${
                      depositAmount
                        ? ` • ₦${parseInt(
                            depositAmount || "0",
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
    gap: 12,
    marginTop: 8,
  },
  txCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  txCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  txIconCredit: {
    backgroundColor: Colors.primaryLight,
  },
  txIconDebit: {
    backgroundColor: Colors.redLight,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.dark,
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  txCardRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "800" as const,
  },
  txAmountCredit: {
    color: Colors.primary,
  },
  txAmountDebit: {
    color: Colors.red,
  },
  txStatus: {
    fontSize: 11,
    fontWeight: "700" as const,
    marginTop: 5,
  },
  txStatusSuccess: {
    color: Colors.green,
  },
  txStatusPending: {
    color: Colors.orange,
  },
  txStatusFailed: {
    color: Colors.red,
  },
  txStatusVoid: {
    color: Colors.gray,
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
