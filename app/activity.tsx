import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import { MOCK_TRANSACTIONS } from "../mocks/data";

type FilterType = "all" | "income" | "expense";

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    let txs = MOCK_TRANSACTIONS;
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filter === "income") txs = txs.filter((t) => t.isCredit);
    if (filter === "expense") txs = txs.filter((t) => !t.isCredit);
    return txs;
  }, [search, filter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.dark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Activity</Text>
          <Text style={styles.headerSub}>LIVE HISTORY</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={Colors.lightGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          placeholderTextColor={Colors.lightGray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
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
              {tx.status === "void" && <Text style={styles.txVoid}>VOID</Text>}
            </View>
            <Text
              style={[
                styles.txAmount,
                tx.isCredit ? styles.amountCredit : styles.amountDebit,
              ]}
            >
              {tx.isCredit ? "+" : "-"}₦{tx.amount.toLocaleString()}
            </Text>
          </View>
        ))}
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
    paddingBottom: 12,
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 10,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    gap: 14,
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
    letterSpacing: 0.5,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  amountCredit: {
    color: Colors.green,
  },
  amountDebit: {
    color: Colors.red,
  },
});
