import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { User } from "../types";
import { STUDENT_DATABASE } from "../mocks/data";
import API_BASE_URL from "../constants/apiConfig";

const AUTH_KEY = "cid_auth";
const USER_KEY = "cid_user";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [authStr, userStr] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (authStr === "true" && userStr) {
        const loadedUser = JSON.parse(userStr);
        console.log("Loaded user from storage:", loadedUser);
        setUser(loadedUser);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.log("Error loading auth state:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const API_URL = API_BASE_URL;

  const register = useCallback(
    async (
      matricNumber: string,
      pin: string,
      idCardImage: string | null,
      email: string,
    ) => {
      const record = STUDENT_DATABASE[matricNumber];
      if (!record) throw new Error("Matric number not found in mock database");

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber,
          pin,
          idCardImage,
          email,
          fullName: record.fullName,
          department: record.department,
          level: record.level,
          phoneNumber: record.phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }

      return { email: data.user.email };
    },
    [],
  );

  const login = useCallback(async (matricNumber: string, pin: string) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matricNumber, pin }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    const { user: loggedInUser } = data;
    const record = STUDENT_DATABASE[matricNumber];

    // --- LOGGING START ---
    console.log("Data from server (loggedInUser):", loggedInUser);
    console.log("Data from mock DB (record):", record);
    // --- LOGGING END ---

    const userWithPin: User = {
      ...loggedInUser,
      fullName: loggedInUser.fullName || record?.fullName,
      phoneNumber: loggedInUser.phoneNumber || record?.phoneNumber,
      walletBalance: loggedInUser.walletBalance ?? 0,
      walletBalance: 0, // Force balance to 0 to clear stale data
      pin,
      idCardImage: loggedInUser.idCardImage || null,
      bloodGroup: loggedInUser.bloodGroup || "Not set",
      bio: loggedInUser.bio || "Campus commuting, safer and faster.",
      profileImage: loggedInUser.profileImage || null,
    };

    console.log("Final user object being saved:", userWithPin);

    await AsyncStorage.setItem(AUTH_KEY, "true");
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userWithPin));
    setUser(userWithPin);
    setIsAuthenticated(true);
    return userWithPin;
  }, []);

  const logout = useCallback(async () => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
    } catch (error) {
      console.error("Failed to log out on server:", error);
    } finally {
      await AsyncStorage.multiRemove([AUTH_KEY, USER_KEY]);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [user]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      console.log("Updating user state:", updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
    },
    [user],
  );

  const updatePin = useCallback(
    async (oldPin: string, newPin: string) => {
      if (!user) throw new Error("Not authenticated");
      if (user.pin !== oldPin) throw new Error("Current PIN is incorrect");
      await updateUser({ pin: newPin });
    },
    [user, updateUser],
  );

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/users/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account on server");
      }
    } finally {
      await AsyncStorage.multiRemove([AUTH_KEY, USER_KEY]);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [user]);

  const setPin = useCallback(async (email: string, pin: string) => {
    const response = await fetch(`${API_URL}/users/set-pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, pin }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to set PIN");
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const response = await fetch(`${API_URL}/users/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "OTP verification failed");
    }

    // Do not log the user in here. Just confirm verification was successful.
    // The user will be logged in after setting their PIN.
    return;
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    const response = await fetch(`${API_URL}/users/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend OTP");
    }
  }, []);

  const toggle2FA = useCallback(
    async (enabled: boolean, method?: "email" | "phone") => {
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/2fa/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, enabled, method }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update 2FA status");
      }

      await updateUser({
        isTwoFactorEnabled: enabled,
        twoFactorMethod: enabled ? method : undefined,
      });
    },
    [user, updateUser],
  );

  return {
    isAuthenticated,
    isLoading,
    user,
    register,
    login,
    logout,
    updateUser,
    updatePin,
    deleteAccount,
    verifyOtp,
    resendOtp,
    setPin,
    toggle2FA,
  };
});
