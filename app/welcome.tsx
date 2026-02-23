import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck, Zap, MapPin, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";

const { width, height } = Dimensions.get("window");

const CAMPUS_IMAGE =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const imageScale = useRef(new Animated.Value(1.2)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const featuresSlide = useRef(new Animated.Value(50)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(60)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(featuresSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/onboarding" as never);
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/login" as never);
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={{ uri: CAMPUS_IMAGE }}
        style={[
          styles.bgImage,
          {
            opacity: imageOpacity,
            transform: [{ scale: imageScale }],
          },
        ]}
        resizeMode="cover"
      />

      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(13,51,32,0.4)",
            "rgba(13,51,32,0.85)",
            "rgba(13,51,32,0.97)",
          ]}
          locations={[0, 0.3, 0.55, 0.75]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Animated.View
          style={[
            styles.topSection,
            { opacity: logoOpacity, transform: [{ translateY: logoSlide }] },
          ]}
        >
          <View style={styles.logoBadge}>
            <ShieldCheck size={20} color={Colors.white} />
            <Text style={styles.logoText}>CID</Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSection}>
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleSlide }],
            }}
          >
            <Text style={styles.campusTag}>KEKE FUNAAB</Text>
            <Text style={styles.appName}>Campus rides,{"\n"}made simple.</Text>
            <Text style={styles.tagline}>
              Safe, affordable transportation for university students across
              campus.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.features,
              {
                opacity: featuresOpacity,
                transform: [{ translateY: featuresSlide }],
              },
            ]}
          >
            <View style={styles.featurePill}>
              <Zap size={14} color={Colors.accent} />
              <Text style={styles.featurePillText}>Quick rides</Text>
            </View>
            <View style={styles.featurePill}>
              <MapPin size={14} color={Colors.accent} />
              <Text style={styles.featurePillText}>Live tracking</Text>
            </View>
            <View style={styles.featurePill}>
              <ShieldCheck size={14} color={Colors.accent} />
              <Text style={styles.featurePillText}>Verified drivers</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttons,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsSlide }],
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={handleGetStarted}
                activeOpacity={0.85}
                testID="get-started-btn"
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <ArrowRight size={20} color={Colors.primaryDark} />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.7}
              testID="login-btn"
            >
              <Text style={styles.loginText}>I already have an account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D3320",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  logoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.white,
    letterSpacing: 2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  campusTag: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.accent,
    letterSpacing: 3,
    marginBottom: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginTop: 12,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  features: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  featurePillText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600" as const,
  },
  buttons: {
    gap: 12,
  },
  getStartedBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.primaryDark,
  },
  loginBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.65)",
    textDecorationLine: "underline",
  },
});
