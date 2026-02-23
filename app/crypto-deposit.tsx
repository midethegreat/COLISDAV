import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bitcoin,
  Copy,
  Check,
  ChevronDown,
  ArrowRight,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { useAuth } from "../providers/AuthProvider";

type CryptoType = "BTC" | "ETH" | "USDT" | "BNB";
type DepositStep = "amount" | "address";

interface CoinInfo {
  symbol: CryptoType;
  name: string;
  rate: number;
  address: string;
  color: string;
  network: string;
}

const COINS: CoinInfo[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    rate: 95000000,
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    color: "#F7931A",
    network: "Bitcoin Network",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    rate: 5800000,
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    color: "#627EEA",
    network: "Ethereum (ERC-20)",
  },
  {
    symbol: "USDT",
    name: "Tether",
    rate: 1650,
    address: "TN3Wv8yFhQmEHxEqJjWqQDzKCeXjBm92Y9",
    color: "#26A17B",
    network: "Tron (TRC-20)",
  },
  {
    symbol: "BNB",
    name: "BNB",
    rate: 920000,
    address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
    color: "#F0B90B",
    network: "BNB Smart Chain (BEP-20)",
  },
];

export default function CryptoDepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [selectedCoin, setSelectedCoin] = useState<CryptoType>("BTC");
  const [showCoinPicker, setShowCoinPicker] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [step, setStep] = useState<DepositStep>("amount");
  const [confirming, setConfirming] = useState<boolean>(false);

  const coin = useMemo(
    () => COINS.find((c) => c.symbol === selectedCoin)!,
    [selectedCoin],
  );

  const cryptoEquivalent = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 || !coin) return "0";
    const equivalent = numAmount / coin.rate;
    if (coin.symbol === "USDT") return equivalent.toFixed(2);
    if (coin.symbol === "BTC") return equivalent.toFixed(8);
    return equivalent.toFixed(6);
  }, [amount, coin]);

  const handleCopy = () => {
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToAddress = () => {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum deposit is ₦100");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("address");
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(async () => {
      const numAmount = parseInt(amount, 10) || 0;
      if (user && numAmount > 0) {
        await updateUser({ walletBalance: user.walletBalance + numAmount });
      }
      setConfirming(false);
      Alert.alert(
        "Payment Received",
        `₦${numAmount.toLocaleString()} will be credited to your wallet after confirmation on the ${coin.network}.`,
        [{ text: "Done", onPress: () => router.back() }],
      );
    }, 2000);
  };

  const presetAmounts = [1000, 2000, 5000, 10000];

  if (step === "address") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep("amount")}
          >
            <ArrowLeft size={22} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send {coin.symbol}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.coinHeaderCard, { borderColor: coin.color }]}>
            <View style={[styles.coinDot, { backgroundColor: coin.color }]} />
            <View style={styles.coinHeaderInfo}>
              <Text style={styles.coinHeaderName}>
                {coin.name} ({coin.symbol})
              </Text>
              <Text style={styles.coinHeaderNetwork}>{coin.network}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>DEPOSIT AMOUNT</Text>
              <Text style={styles.summaryValue}>
                ₦{parseInt(amount || "0", 10).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>YOU SEND</Text>
              <Text style={[styles.summaryValue, { color: coin.color }]}>
                {cryptoEquivalent} {coin.symbol}
              </Text>
            </View>
          </View>

          <Text style={styles.addressLabel}>DEPOSIT ADDRESS</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText} selectable>
              {coin.address}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              {copied ? (
                <Check size={18} color={Colors.primary} />
              ) : (
                <Copy size={18} color={Colors.gray} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.copyHint}>
            {copied
              ? "Address copied!"
              : "Tap the copy icon to copy the address"}
          </Text>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              • Only send {coin.symbol} to this address on the {coin.network}
              {"\n"}• Sending any other coin may result in permanent loss{"\n"}•
              Your wallet will be credited after network confirmation{"\n"}•
              Minimum 1 confirmation required
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmPaymentBtn,
              confirming && styles.confirmPaymentBtnDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={confirming}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmPaymentText}>
              {confirming ? "Verifying Payment..." : "I Have Made Payment"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crypto Deposit</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>SELECT COIN</Text>
        <TouchableOpacity
          style={styles.coinSelector}
          onPress={() => setShowCoinPicker(true)}
        >
          <View style={[styles.coinDot, { backgroundColor: coin.color }]} />
          <View style={styles.coinSelectorInfo}>
            <Text style={styles.coinSelectorName}>{coin.name}</Text>
            <Text style={styles.coinSelectorSymbol}>{coin.symbol}</Text>
          </View>
          <ChevronDown size={18} color={Colors.gray} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>AMOUNT (₦)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.lightGray}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />

        {amount && parseFloat(amount) > 0 && (
          <View style={styles.equivalentCard}>
            <Text style={styles.equivalentLabel}>YOU WILL SEND</Text>
            <Text style={[styles.equivalentAmount, { color: coin.color }]}>
              {cryptoEquivalent} {coin.symbol}
            </Text>
            <Text style={styles.equivalentRate}>
              1 {coin.symbol} ≈ ₦{coin.rate.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.presetRow}>
          {presetAmounts.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetBtn,
                amount === preset.toString() && styles.presetBtnActive,
              ]}
              onPress={() => setAmount(preset.toString())}
            >
              <Text
                style={[
                  styles.presetText,
                  amount === preset.toString() && styles.presetTextActive,
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
            (!amount || parseFloat(amount) < 100) && styles.proceedBtnDisabled,
          ]}
          onPress={handleProceedToAddress}
          disabled={!amount || parseFloat(amount) < 100}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedBtnText}>Continue</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCoinPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Cryptocurrency</Text>
              <TouchableOpacity
                style={styles.pickerCloseBtn}
                onPress={() => setShowCoinPicker(false)}
              >
                <X size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            {COINS.map((c) => (
              <TouchableOpacity
                key={c.symbol}
                style={[
                  styles.coinOption,
                  selectedCoin === c.symbol && styles.coinOptionActive,
                ]}
                onPress={() => {
                  setSelectedCoin(c.symbol);
                  setShowCoinPicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={[styles.coinDot, { backgroundColor: c.color }]} />
                <View style={styles.coinOptionInfo}>
                  <Text style={styles.coinOptionName}>{c.name}</Text>
                  <Text style={styles.coinOptionRate}>
                    1 {c.symbol} ≈ ₦{c.rate.toLocaleString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.coinOptionSymbol,
                    selectedCoin === c.symbol && { color: Colors.primary },
                  ]}
                >
                  {c.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  coinSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  coinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  coinSelectorInfo: {
    flex: 1,
  },
  coinSelectorName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  coinSelectorSymbol: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
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
  equivalentCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equivalentLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 6,
  },
  equivalentAmount: {
    fontSize: 24,
    fontWeight: "800" as const,
  },
  equivalentRate: {
    fontSize: 11,
    color: Colors.lightGray,
    marginTop: 6,
  },
  presetRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
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
  proceedBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  proceedBtnDisabled: {
    opacity: 0.5,
  },
  proceedBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  coinOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  coinOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  coinOptionInfo: {
    flex: 1,
  },
  coinOptionName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  coinOptionRate: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  coinOptionSymbol: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.gray,
  },
  coinHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
    backgroundColor: Colors.background,
  },
  coinHeaderInfo: {
    flex: 1,
  },
  coinHeaderName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  coinHeaderNetwork: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.dark,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyHint: {
    fontSize: 11,
    color: Colors.lightGray,
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#C2410C",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#9A3412",
    lineHeight: 20,
  },
  confirmPaymentBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmPaymentBtnDisabled: {
    opacity: 0.5,
  },
  confirmPaymentText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  cancelLink: {
    alignItems: "center",
    marginTop: 16,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.gray,
  },
});
