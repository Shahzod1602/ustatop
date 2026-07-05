import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";

interface Request {
  id: string;
  title: string;
  description?: string;
  status: string;
  address?: string;
  createdAt: string;
  category?: {
    nameUz?: string;
    icon?: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: {
    label: "Kutilmoqda",
    color: "#a16207",
    bg: "#fef3c7",
    icon: "time-outline",
  },
  MATCHED: {
    label: "Usta topildi",
    color: "#1d4ed8",
    bg: "#dbeafe",
    icon: "people-outline",
  },
  ACCEPTED: {
    label: "Qabul qilindi",
    color: "#15803d",
    bg: "#dcfce7",
    icon: "checkmark-circle-outline",
  },
  IN_PROGRESS: {
    label: "Bajarilmoqda",
    color: "#c2410c",
    bg: "#ffedd5",
    icon: "construct-outline",
  },
  COMPLETED: {
    label: "Yakunlandi",
    color: "#059669",
    bg: "#d1fae5",
    icon: "checkmark-done-outline",
  },
  CANCELLED: {
    label: "Bekor qilindi",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "close-circle-outline",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      color: COLORS.textMuted,
      bg: COLORS.inputBg,
      icon: "help-outline" as keyof typeof Ionicons.glyphMap,
    }
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
  ];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${hours}:${minutes}`;
}

function getCategoryIcon(name?: string): keyof typeof Ionicons.glyphMap {
  if (!name) return "build-outline";
  const lower = name.toLowerCase();
  if (lower.includes("santexnik") || lower.includes("suv")) return "water-outline";
  if (lower.includes("elektr")) return "flash-outline";
  if (lower.includes("tozala")) return "sparkles-outline";
  if (lower.includes("bo'ya") || lower.includes("remont")) return "color-palette-outline";
  if (lower.includes("duradgor")) return "hammer-outline";
  if (lower.includes("konditsi")) return "snow-outline";
  return "build-outline";
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const data = await api<{ items: Request[] }>("/api/my-requests");
      setRequests(data.items ?? []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  function renderItem({ item }: { item: Request }) {
    const status = getStatusConfig(item.status);

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {item.category && (
          <View style={styles.categoryRow}>
            <View style={styles.categoryChip}>
              <Ionicons
                name={getCategoryIcon(item.category.nameUz ?? "")}
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.categoryText}>{item.category.nameUz}</Text>
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.address && (
            <View style={styles.footerItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.footerText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons
            name="clipboard-outline"
            size={64}
            color={COLORS.textMuted}
          />
        </View>
        <Text style={styles.emptyTitle}>So'rovlar topilmadi</Text>
        <Text style={styles.emptySubtitle}>
          Yangi so'rov yarating va ustalar sizga javob qaytarsin
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push("/(tabs)/request")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.emptyButtonText}>Yangi so'rov</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mening so'rovlarim</Text>
        {requests.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{requests.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  countBadge: {
    marginLeft: 12,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitleRow: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: "#fff",
  },
});
