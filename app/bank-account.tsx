import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  ShieldCheck,
  Search,
  X,
  Trash,
  ArrowLeft,
  Banknote,
} from "lucide-react-native";

import Colors from "../constants/color";
import { api } from "../constants/api";

const BankAccount = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [verifiedAccountName, setVerifiedAccountName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);

  const filteredBanks = useMemo(() => {
    if (!searchQuery) {
      return allBanks;
    }
    return allBanks.filter((bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allBanks]);

  useEffect(() => {
    const fetchBankList = async () => {
      try {
        const response = await fetch(`${api.baseUrl}/bank/list`);
        if (response.ok) {
          const data = await response.json();
          setAllBanks(data);
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch bank list:",
            response.status,
            errorText,
          );
          Alert.alert(
            "Error",
            `Could not load the list of banks. Server responded with: ${errorText}`,
          );
        }
      } catch (error) {
        console.error("Error fetching bank list:", error);
        Alert.alert(
          "Error",
          "An unexpected error occurred while loading banks. Please check your connection.",
        );
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBankList();
  }, []);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        // TODO: Replace this with your actual logic to get the logged-in user's ID
        const getUserId = () => "b965561b-7456-42e7-a608-21fdf2fae680";
        const userId = getUserId();

        if (!userId) {
          console.error(
            "User ID is not available, cannot fetch bank accounts.",
          );
          return;
        }

        const response = await fetch(`${api.baseUrl}/bank/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setSavedAccounts(data);
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch bank accounts:",
            response.status,
            errorText,
          );
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
      }
    };

    fetchBankAccounts();
  }, []);

  const handleVerifyAccount = async () => {
    if (!selectedBank || !accountNumber) {
      Alert.alert("Error", "Please select a bank and enter an account number.");
      return;
    }
    setIsVerifying(true);
    setVerifiedAccountName("");
    try {
      const response = await fetch(`${api.baseUrl}/bank/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBank.code,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifiedAccountName(data.account_name);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (error) {
      Alert.alert(
        "Verification Error",
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddAccount = async () => {
    if (!verifiedAccountName || !selectedBank || !accountNumber) {
      Alert.alert("Error", "Please verify account details before adding.");
      return;
    }
    setIsAdding(true);
    try {
      // IMPORTANT: Replace 'YOUR_USER_ID' with the actual user ID
      const response = await fetch(`${api.baseUrl}/bank/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "b965561b-7456-42e7-a608-21fdf2fae680", // Using the same hardcoded user ID for now
          bankName: selectedBank.name,
          accountNumber,
          accountName: verifiedAccountName,
          bankCode: selectedBank.code,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Bank account added successfully.");
        setSavedAccounts((prev) => [...prev, data.account]);
        // Reset form
        setAccountNumber("");
        setSelectedBank(null);
        setVerifiedAccountName("");
      } else {
        throw new Error(data.message || "Failed to add account");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this bank account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(accountId),
        },
      ],
    );
  };

  const confirmDelete = async (accountId: string) => {
    try {
      const response = await fetch(`${api.baseUrl}/bank/${accountId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSavedAccounts(
          savedAccounts.filter((account) => account.id !== accountId),
        );
        Alert.alert("Success", "Bank account deleted.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const onBankSelect = (bank: { name: string; code: string }) => {
    setSelectedBank(bank);
    setModalVisible(false);
    setSearchQuery("");
    setVerifiedAccountName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Account</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {savedAccounts.length > 0 ? (
          <View style={styles.savedAccountsContainer}>
            <Text style={styles.subtitle}>
              This is your linked bank account. You can remove it to link a new
              one.
            </Text>
            <FlatList
              data={savedAccounts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.savedAccountCard}>
                  <View style={styles.bankIconContainer}>
                    <Banknote size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.savedAccountInfo}>
                    <Text style={styles.savedAccountBank}>{item.bankName}</Text>
                    <Text style={styles.savedAccountName}>
                      {item.accountName}
                    </Text>
                    <Text style={styles.savedAccountNumber}>
                      {item.accountNumber}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAccount(item.id)}
                  >
                    <Trash size={22} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Securely link your bank account to manage your funds.
            </Text>

            <TouchableOpacity
              style={styles.picker}
              onPress={() => {
                if (!isLoadingBanks) {
                  setModalVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              disabled={isLoadingBanks}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: selectedBank ? Colors.dark : Colors.gray },
                ]}
              >
                {isLoadingBanks
                  ? "Loading banks..."
                  : selectedBank
                    ? selectedBank.name
                    : "Select a Bank"}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Account Number"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={(text) => {
                setAccountNumber(text);
                setVerifiedAccountName("");
              }}
              placeholderTextColor={Colors.gray}
            />

            {verifiedAccountName ? (
              <>
                <View style={styles.verifiedContainer}>
                  <Text style={styles.verifiedLabel}>Account Name</Text>
                  <View style={styles.verifiedBox}>
                    <ShieldCheck size={24} color={Colors.green} />
                    <Text style={styles.verifiedName}>
                      {verifiedAccountName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleAddAccount}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Confirm & Add Account</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      !selectedBank || !accountNumber
                        ? Colors.gray
                        : Colors.primary,
                  },
                ]}
                onPress={handleVerifyAccount}
                disabled={isVerifying || !selectedBank || !accountNumber}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Account</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.searchHeader}>
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a bank..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.gray}
              />
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          {isLoadingBanks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading Banks...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankItem}
                  onPress={() => onBankSelect(item)}
                >
                  <Text style={styles.bankItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No banks found.</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray,
    marginBottom: 24,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  picker: {
    height: 55,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: Colors.light,
    marginHorizontal: 20,
  },
  pickerText: {
    fontSize: 16,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: Colors.light,
    color: Colors.dark,
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  verifiedContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  verifiedLabel: {
    color: Colors.gray,
    fontSize: 14,
    marginBottom: 8,
  },
  verifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGreen,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.green,
  },
  verifiedName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
  },
  confirmButton: {
    backgroundColor: Colors.green,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.light,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  bankItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bankItemText: {
    fontSize: 16,
    color: Colors.dark,
  },
  savedAccountsContainer: {
    marginTop: 10,
    flex: 1,
  },
  savedAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  savedAccountInfo: {
    flex: 1,
  },
  savedAccountBank: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark,
  },
  savedAccountName: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  savedAccountNumber: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.gray,
  },
});

export default BankAccount;
