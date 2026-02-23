import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Share2, Download, CheckCircle } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
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
  const receiptRef = useRef();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 0.9,
        result: "tmpfile",
      });

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `CID Receipt - ${txId}`,
      });
    } catch (error) {
      console.log("Share error:", error);
      Alert.alert("Error", "Could not share receipt. Please try again.");
    }
  };

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your photo gallery to save the receipt.",
        );
        return;
      }

      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1.0,
        result: "tmpfile",
      });

      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert(
        "Saved!",
        "The receipt has been saved to your photo gallery.",
      );
    } catch (error) {
      console.log("Download error:", error);
      Alert.alert("Error", "Could not save receipt. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-RECEIPT</Text>
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
      </View>

      <View style={styles.receiptContainer}>
        <ViewShot
          ref={receiptRef}
          options={{ format: "png", quality: 0.9 }}
          style={styles.receiptShot}
        >
          <View style={styles.receiptCard}>
            <View style={styles.tearEdge}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.tearTriangle} />
              ))}
            </View>

            <View style={styles.receiptInner}>
              <View style={styles.checkCircle}>
                <CheckCircle
                  size={32}
                  color={isVoided ? Colors.red : Colors.primary}
                />
              </View>

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
        </ViewShot>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <Download size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
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
      </View>
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
  receiptContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  receiptShot: {
    backgroundColor: Colors.white,
    borderRadius: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  receiptCard: {
    backgroundColor: "transparent",
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
