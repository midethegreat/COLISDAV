import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Menu,
  Star,
  ShieldCheck,
  Clock,
  Truck,
  Package,
  FileText,
  Bell,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/color";
import DrawerMenu from "../components/DrawerMenu";
import Header from "../components/Header";

const PLANNED_SERVICES = [
  {
    title: "Food Delivery",
    desc: "Order from campus vendors like Motion Ground or Bukka.",
    tag: "FAST",
    icon: Truck,
  },
  {
    title: "Errand Runner",
    desc: "Get a student partner to help with errands across halls.",
    tag: "SAFE",
    icon: Package,
  },
  {
    title: "Paper Courier",
    desc: "Secure document moving between departments & admin.",
    tag: "OFFICIAL",
    icon: FileText,
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Services"
        subtitle="BEYOND CAMPUS COMMUTING"
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.roadmapCard}>
          <View style={styles.roadmapTag}>
            <Star size={14} color="#F59E0B" />
            <Text style={styles.roadmapTagText}>ROADMAP 2024</Text>
          </View>
          <Text style={styles.roadmapTitle}>Campus Ecosystem</Text>
          <Text style={styles.roadmapDesc}>
            CID Nigeria isn't just for rides. We're building the infrastructure
            for a more efficient campus life. Stay tuned for these modules!
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PLANNED SERVICES</Text>
          <View style={styles.verifiedHub}>
            <ShieldCheck size={14} color={Colors.primary} />
            <Text style={styles.verifiedHubText}>VERIFIED HUB</Text>
          </View>
        </View>

        {PLANNED_SERVICES.map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <View style={styles.comingSoonBadge}>
                <Clock size={10} color={Colors.primary} />
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
            </View>
            <Text style={styles.serviceDesc}>{service.desc}</Text>
            <Text style={styles.serviceTag}>{service.tag}</Text>
          </View>
        ))}
      </ScrollView>

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
    padding: 16,
    paddingBottom: 40,
  },
  roadmapCard: {
    backgroundColor: Colors.dark,
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
  },
  roadmapTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  roadmapTagText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  roadmapTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  roadmapDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
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
  verifiedHub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedHubText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.dark,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  serviceDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 19,
    marginBottom: 10,
  },
  serviceTag: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.lightGray,
    letterSpacing: 1,
    alignSelf: "flex-end",
  },
});
