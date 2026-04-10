import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { COLORS } from "../../lib/constants";

interface DashboardStats {
  activeJobs: number;
  completedJobs: number;
  averageRating: number;
  totalEarnings: number;
}

interface RequestItem {
  id: string;
  title: string;
  description: string;
  categoryName?: string;
  customerName: string;
  customerPhoto?: string;
  location?: string;
  createdAt: string;
  status: string;
}

type BottomTab = "requests" | "map" | "news" | "stats" | "profile";

const BOTTOM_TABS: { key: BottomTab; label: string; icon: string }[] = [
  { key: "requests", label: "SO'ROVLAR", icon: "clipboard-outline" },
  { key: "map", label: "XARITA", icon: "map-outline" },
  { key: "news", label: "YANGILIK", icon: "newspaper-outline" },
  { key: "stats", label: "STATISTIKA", icon: "bar-chart-outline" },
  { key: "profile", label: "PROFIL", icon: "person-outline" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
  });
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomTab>("requests");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const data = await api<{
        stats: DashboardStats;
        requests: RequestItem[];
      }>(`/api/requests?masterId=${user?.id}`);
      if (data.stats) setStats(data.stats);
      if (data.requests) setRequests(data.requests);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function handleAccept(id: string) {
    try {
      await api(`/api/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      Alert.alert("Muvaffaqiyat", "So'rov qabul qilindi!");
    } catch {
      Alert.alert("Xatolik", "So'rovni qabul qilishda xatolik yuz berdi");
    }
  }

  async function handleReject(id: string) {
    try {
      await api(`/api/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      Alert.alert("Xatolik", "So'rovni rad etishda xatolik yuz berdi");
    }
  }

  function formatTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) return `${diffMin} daqiqa oldin`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} soat oldin`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} kun oldin`;
    } catch {
      return "";
    }
  }

  function renderStatCard(
    label: string,
    value: string,
    iconName: keyof typeof Ionicons.glyphMap,
    isGradient?: boolean
  ) {
    const content = (
      <>
        <View
          style={[
            styles.statIconWrap,
            isGradient && styles.statIconWrapGradient,
          ]}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={isGradient ? "#fff" : COLORS.primary}
          />
        </View>
        <Text
          style={[styles.statValue, isGradient && styles.statValueGradient]}
        >
          {value}
        </Text>
        <Text
          style={[styles.statLabel, isGradient && styles.statLabelGradient]}
        >
          {label}
        </Text>
      </>
    );

    if (isGradient) {
      return (
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      );
    }

    return <View style={styles.statCard}>{content}</View>;
  }

  function renderRequestCard({ item }: { item: RequestItem }) {
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestCardHeader}>
          <View style={styles.requestCustomerRow}>
            {item.customerPhoto ? (
              <Image
                source={{ uri: item.customerPhoto }}
                style={styles.customerPhoto}
              />
            ) : (
              <View style={styles.customerPhotoPlaceholder}>
                <Ionicons name="person" size={18} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              {item.categoryName && (
                <Text style={styles.requestCategory}>{item.categoryName}</Text>
              )}
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>YANGI</Text>
            </View>
          </View>
        </View>

        <Text style={styles.requestTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.requestDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.requestMeta}>
          {item.location && (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.metaText}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptBtnText}>Qabul qilish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.rejectBtnText}>Rad etish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Top header */}
        <View style={styles.topHeader}>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.logoText}>UstaTop</Text>
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={18} color={COLORS.textMuted} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>
              Xush kelibsiz, {user?.name ?? "Usta"}!
            </Text>
            <Text style={styles.greetingSubtitle}>
              Sizda {requests.length} ta yangi so'rov bor
            </Text>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {renderStatCard(
              "FAOL ISHLAR",
              String(stats.activeJobs),
              "briefcase-outline"
            )}
            {renderStatCard(
              "YAKUNLANGAN",
              String(stats.completedJobs),
              "checkmark-circle-outline"
            )}
            {renderStatCard(
              "O'RTACHA REYTING",
              stats.averageRating.toFixed(1),
              "star-outline"
            )}
            {renderStatCard(
              "JAMI DAROMAD",
              `${stats.totalEarnings.toLocaleString()} so'm`,
              "wallet-outline",
              true
            )}
          </View>

          {/* Requests section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yangi so'rovlar</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Hammasini ko'rish</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color={COLORS.border}
              />
              <Text style={styles.emptyText}>
                Hozircha yangi so'rovlar yo'q
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestCard}
              scrollEnabled={false}
              contentContainerStyle={styles.requestsList}
            />
          )}
        </ScrollView>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          {BOTTOM_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.bottomNavItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={
                  activeTab === tab.key ? COLORS.primary : COLORS.textMuted
                }
              />
              <Text
                style={[
                  styles.bottomNavLabel,
                  activeTab === tab.key && styles.bottomNavLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f0",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f0",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f0",
  },

  // Top header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scrollContent: {
    paddingBottom: 16,
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  greetingTitle: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: "1.5%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff0e6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statIconWrapGradient: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    marginBottom: 2,
  },
  statValueGradient: {
    color: "#fff",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  statLabelGradient: {
    color: "rgba(255,255,255,0.8)",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },

  // Requests list
  requestsList: {
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestCardHeader: {
    marginBottom: 10,
  },
  requestCustomerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  requestCategory: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
  },
  newBadge: {
    backgroundColor: "#fff0e6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  requestTitle: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  requestDesc: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  requestActions: {
    flexDirection: "row",
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  rejectBtnText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textMuted,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
    marginTop: 12,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLabel: {
    fontSize: 9,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  bottomNavLabelActive: {
    color: COLORS.primary,
  },
});
