import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { NotificationProvider } from "../providers/NotificationProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const PUBLIC_ROUTES = ["welcome", "login", "onboarding", "+not-found"];

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] as string | undefined;

    if (isAuthenticated) {
      // If authenticated, redirect away from welcome/login/onboarding
      if (
        currentRoute === "welcome" ||
        currentRoute === "login" ||
        currentRoute === "onboarding"
      ) {
        router.replace("/" as never);
      }
    } else {
      // If not authenticated, ensure they are on a public route or redirect to welcome
      const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute ?? "");
      if (!isPublicRoute) {
        router.replace("/welcome" as never);
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rides" options={{ presentation: "card" }} />
      <Stack.Screen name="wallet" options={{ presentation: "card" }} />
      <Stack.Screen name="profile" options={{ presentation: "card" }} />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" options={{ presentation: "card" }} />
      <Stack.Screen name="onboarding" options={{ presentation: "card" }} />
      <Stack.Screen name="booking-confirm" options={{ presentation: "card" }} />
      <Stack.Screen name="ride-history" options={{ presentation: "card" }} />
      <Stack.Screen name="activity" options={{ presentation: "card" }} />
      <Stack.Screen name="personal-info" options={{ presentation: "card" }} />
      <Stack.Screen name="chat" options={{ presentation: "card" }} />
      <Stack.Screen name="support" options={{ presentation: "card" }} />
      <Stack.Screen name="support-hub" options={{ presentation: "card" }} />
      <Stack.Screen name="services" options={{ presentation: "card" }} />
      <Stack.Screen name="rewards" options={{ presentation: "card" }} />
      <Stack.Screen name="crypto-deposit" options={{ presentation: "card" }} />
      <Stack.Screen name="pin-settings" options={{ presentation: "card" }} />
      <Stack.Screen name="receipt" options={{ presentation: "modal" }} />
      <Stack.Screen name="notifications" options={{ presentation: "card" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NotificationProvider>
            <RootLayoutNav />
          </NotificationProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
