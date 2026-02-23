import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Share2, Printer, CheckCircle } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DepositReceipt from "../components/DepositReceipt";
import Colors from "../constants/color";

export default function ReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    txId: string;
    fare: string;
    tip?: string;
    pickup: string;
    destination: string;
    date: string;
    status: string;
    type?: string;
  }>();

  if (params.type === "deposit") {
    return <DepositReceipt route={{ params }} />;
  }

  const isVoided = params.status === "cancelled";
  const fare = parseInt(params.fare ?? "200", 10);
  const tipAmount = parseInt(params.tip ?? "0", 10);
  const totalBill = fare + tipAmount;
  const txId = params.txId ?? "TX-103";
  const pickupName = params.pickup ?? "Senate Building";
  const destName = params.destination ?? "Library Junction";
  const dateStr = params.date ?? "Oct 23, 09:10 AM";

  const [isPrinting, setIsPrinting] = useState<boolean>(true);
  const [printComplete, setPrintComplete] = useState<boolean>(false);
  const printSlide = useRef(new Animated.Value(-500)).current;
  const printerFeed = useRef(new Animated.Value(0)).current;
  const receiptOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const stripAnim1 = useRef(new Animated.Value(0)).current;
  const stripAnim2 = useRef(new Animated.Value(0)).current;
  const stripAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(printerFeed, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.timing(stripAnim1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(stripAnim2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(stripAnim3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(printSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(receiptOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPrinting(false);
      setPrintComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const receiptText = `
CID NIGERIA - E-RECEIPT
========================
VERIFIED CAMPUS PARTNER
FUNAAB
Date: ${dateStr}
TX ID: ${txId}
------------------------
BILLING DETAILS
CAMPUS COMMUTE
From: ${pickupName}
To: ${destName}
Amount: ₦${fare}
Tip: ₦${tipAmount}
SERVICE FEE: ₦0
------------------------
TOTAL BILL: ₦${totalBill}
${isVoided ? "STATUS: VOIDED" : "STATUS: COMPLETED"}
========================
Thank you for riding with CID!
  `.trim();

  const receiptHtml = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #1B7A43; padding-bottom: 20px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: bold; color: #1A2332; }
          .partner { font-size: 10px; color: #1B7A43; letter-spacing: 2px; margin-top: 4px; }
          .campus { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; margin: 16px 0; font-size: 12px; color: #374151; }
          .divider { border-top: 1px dashed #E5E7EB; margin: 16px 0; }
          .section-label { font-size: 10px; color: #1B7A43; letter-spacing: 2px; margin-bottom: 12px; }
          .billing-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .billing-title { font-size: 14px; font-weight: bold; color: #1A2332; }
          .route { font-size: 12px; color: #6B7280; margin-top: 4px; }
          .route-to { font-size: 12px; color: #1B7A43; font-weight: bold; margin-top: 2px; }
          .amount { font-size: 18px; font-weight: bold; color: #1A2332; }
          .fee-row { display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF; margin: 8px 0; }
          .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
          .total-label { font-size: 14px; font-weight: bold; color: #1A2332; }
          .total-amount { font-size: 24px; font-weight: bold; color: ${isVoided ? "#DC2626" : "#1B7A43"}; ${isVoided ? "text-decoration: line-through;" : ""} }
          .voided { font-size: 10px; color: #DC2626; letter-spacing: 1px; text-align: right; margin-top: 4px; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #9CA3AF; }
          .status-badge { text-align: center; padding: 8px; border-radius: 8px; margin-top: 16px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }
          .status-completed { background: #D1FAE5; color: #1B7A43; }
          .status-voided { background: #FEE2E2; color: #DC2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">CID NIGERIA</div>
          <div class="partner">VERIFIED CAMPUS PARTNER</div>
          <div class="campus">FUNAAB</div>
        </div>
        <div class="meta">
          <span>${dateStr}</span>
          <span>${txId}</span>
        </div>
        <div class="divider"></div>
        <div class="section-label">BILLING DETAILS</div>
        <div class="billing-row">
          <div>
            <div class="billing-title">CAMPUS COMMUTE</div>
            <div class="route">${pickupName}</div>
            <div class="route-to">→ ${destName}</div>
          </div>
          <div class="amount">₦${fare}</div>
        </div>
        <div class="fee-row">
          <span>Tip</span>
          <span>₦${tipAmount}</span>
        </div>
        <div class="fee-row">
          <span>SERVICE FEE</span>
          <span>₦0</span>
        </div>
        <div class="divider"></div>
        <div class="total-row">
          <span class="total-label">TOTAL BILL</span>
          <div>
            <div class="total-amount">₦${totalBill}</div>
            ${isVoided ? '<div class="voided">TRANSACTION VOIDED</div>' : ""}
          </div>
        </div>
        <div class="status-badge ${isVoided ? "status-voided" : "status-completed"}">
          ${isVoided ? "VOIDED" : "PAYMENT COMPLETED"}
        </div>
        <div class="footer">Thank you for riding with CID Nigeria!</div>
      </body>
    </html>
  `;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: receiptText,
        title: `CID Receipt - ${txId}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const printerScaleY = printerFeed.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-RECEIPT</Text>
        {printComplete ? (
          <View style={styles.doneRow}>
            <View
              style={[
                styles.doneDot,
                { backgroundColor: isVoided ? Colors.red : Colors.green },
              ]}
            />
            <Text
              style={[
                styles.doneText,
                { color: isVoided ? Colors.red : Colors.green },
              ]}
            >
              {isVoided ? "VOIDED" : "PAID"}
            </Text>
          </View>
        ) : (
          <View style={styles.printingRow}>
            <Printer size={16} color={Colors.primary} />
            <Text style={styles.printingText}>PRINTING...</Text>
          </View>
        )}
      </View>

      <View style={styles.printerArea}>
        {isPrinting && (
          <View style={styles.printerSlot}>
            <View style={styles.printerBody}>
              <View style={styles.printerTop} />
              <View style={styles.printerSlotLine} />
              <Animated.View
                style={[
                  styles.feedStrip,
                  { opacity: stripAnim1, transform: [{ scaleX: stripAnim1 }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.feedStrip,
                  styles.feedStrip2,
                  { opacity: stripAnim2, transform: [{ scaleX: stripAnim2 }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.feedStrip,
                  styles.feedStrip3,
                  { opacity: stripAnim3, transform: [{ scaleX: stripAnim3 }] },
                ]}
              />
            </View>
          </View>
        )}

        <Animated.View
          style={[
            styles.receiptWrap,
            {
              transform: [
                { translateY: printSlide },
                { scaleY: printerScaleY },
              ],
              opacity: receiptOpacity,
            },
          ]}
        >
          <View style={styles.receiptCard}>
            <View style={styles.tearEdge}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.tearTriangle} />
              ))}
            </View>

            <View style={styles.receiptInner}>
              <Animated.View
                style={[
                  styles.checkCircle,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                {printComplete && (
                  <CheckCircle
                    size={32}
                    color={isVoided ? Colors.red : Colors.primary}
                  />
                )}
              </Animated.View>

              <Text style={styles.brand}>CID NIGERIA</Text>
              <Text style={styles.partnerLabel}>VERIFIED CAMPUS PARTNER</Text>
              <Text style={styles.campus}>FUNAAB</Text>

              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{dateStr}</Text>
                <Text style={styles.txId}>{txId}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.billingLabel}>BILLING DETAILS</Text>

              <View style={styles.billingRow}>
                <View>
                  <Text style={styles.billingTitle}>CAMPUS COMMUTE</Text>
                  <Text style={styles.billingRoute}>{pickupName}</Text>
                  <Text style={styles.billingRouteTo}>→ {destName}</Text>
                </View>
                <Text style={styles.billingAmount}>₦{fare}</Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>TIP</Text>
                <Text style={styles.feeValue}>₦{tipAmount}</Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>SERVICE FEE</Text>
                <Text style={styles.feeValue}>₦0</Text>
              </View>

              <View style={styles.dashedLine} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL BILL</Text>
                <View style={styles.totalRight}>
                  <Text
                    style={[
                      styles.totalAmount,
                      isVoided && styles.voidedAmount,
                    ]}
                  >
                    ₦{totalBill}
                  </Text>
                  {isVoided && (
                    <Text style={styles.voidedLabel}>TRANSACTION VOIDED</Text>
                  )}
                </View>
              </View>

              <View style={styles.dashedLine} />

              <View style={styles.qrContainer}>
                <QRCode
                  value={`TXID:${txId}`}
                  size={100}
                  backgroundColor="white"
                  color="black"
                  logo={require("../assets/images/icon.png")}
                  logoSize={20}
                  logoBackgroundColor="transparent"
                />
                <Text style={styles.scanText}>Scan to verify</Text>
              </View>
            </View>

            <View style={styles.tearEdgeBottom}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.tearTriangleBottom} />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          { opacity: actionsOpacity, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Share2 size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.dark,
    letterSpacing: 1,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  doneText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  printingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  printingText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  printerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  printerSlot: {
    alignItems: "center",
    zIndex: 2,
  },
  printerBody: {
    width: 280,
    height: 48,
    backgroundColor: Colors.dark,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  printerTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#2A3544",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  printerSlotLine: {
    width: "70%",
    height: 3,
    backgroundColor: "#374151",
    borderRadius: 2,
    marginTop: 6,
  },
  feedStrip: {
    width: "60%",
    height: 2,
    backgroundColor: "#4B5563",
    borderRadius: 1,
    marginTop: 4,
  },
  feedStrip2: {
    width: "50%",
  },
  feedStrip3: {
    width: "40%",
  },
  receiptWrap: {
    paddingHorizontal: 24,
    width: "100%",
    marginTop: -4,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  tearEdge: {
    flexDirection: "row",
    height: 10,
    overflow: "hidden",
  },
  tearTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#F0F2F5",
  },
  tearEdgeBottom: {
    flexDirection: "row",
    height: 10,
    overflow: "hidden",
  },
  tearTriangleBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F0F2F5",
  },
  receiptInner: {
    padding: 28,
    paddingTop: 20,
  },
  checkCircle: {
    alignSelf: "center",
    marginBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: Colors.dark,
    textAlign: "center" as const,
  },
  partnerLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1.5,
    textAlign: "center" as const,
    marginTop: 4,
  },
  campus: {
    fontSize: 11,
    color: Colors.lightGray,
    textAlign: "center" as const,
    marginTop: 4,
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.dark,
  },
  txId: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.gray,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  billingLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  billingTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.dark,
    marginBottom: 4,
  },
  billingRoute: {
    fontSize: 11,
    color: Colors.gray,
    marginTop: 2,
  },
  billingRouteTo: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  billingAmount: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.lightGray,
    letterSpacing: 0.5,
  },
  feeValue: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.lightGray,
  },
  dashedLine: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.dark,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: Colors.primary,
  },
  voidedAmount: {
    textDecorationLine: "line-through",
    color: Colors.red,
  },
  voidedLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.red,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  qrContainer: {
    alignItems: "center",
    gap: 8,
  },
  scanText: {
    fontSize: 9,
    color: Colors.lightGray,
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  doneBtn: {
    backgroundColor: Colors.dark,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.white,
  },
});
