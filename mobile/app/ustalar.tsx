import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../lib/constants";
import { api } from "../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Master {
  id: string;
  fullName: string;
  phone?: string;
  bio?: string;
  image?: string;
  rating: number;
  reviewCount: number;
  city?: string;
  verified: boolean;
  categories: { id: string; name: string }[];
}

type ApiMaster = {
  id: string;
  fullName: string;
  phone?: string | null;
  bio?: string | null;
  profilePhoto?: string | null;
  serviceArea?: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  categories: { category: { id: string; nameUz: string; icon?: string } }[];
};

function mapMaster(m: ApiMaster): Master {
  return {
    id: m.id,
    fullName: m.fullName,
    phone: m.phone ?? undefined,
    bio: m.bio ?? undefined,
    image: m.profilePhoto ?? undefined,
    rating: m.rating,
    reviewCount: m.reviewCount,
    city: m.serviceArea ?? undefined,
    verified: m.isVerified,
    categories: m.categories.map((c) => ({ id: c.category.id, name: c.category.nameUz })),
  };
}

const AVATAR_COLORS = [
  "#ff6b2b",
  "#3b82f6",
  "#16a34a",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const FILTER_CHIPS = [
  { key: "category", label: "Kategoriya", icon: "grid-outline" as const },
  { key: "city", label: "Shahar", icon: "location-outline" as const },
  { key: "rating", label: "Reyting", icon: "star-outline" as const },
];

export default function UstalarScreen() {
  const router = useRouter();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api<{ masters: ApiMaster[] }>("/api/masters?limit=50");
        if (alive) setMasters((data.masters ?? []).map(mapMaster));
      } catch {
        if (alive) setMasters([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  function handleCall(phone?: string) {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function renderMasterCard({ item, index }: { item: Master; index: number }) {
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const isBookmarked = bookmarked.has(item.id);

    return (
      <TouchableOpacity
        style={styles.masterCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/usta/${item.id}`)}
      >
        <View style={styles.masterCardTop}>
          {/* Avatar */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(item.fullName)}</Text>
            </View>
          )}

          <View style={styles.masterInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.masterName} numberOfLines={1}>
                {item.fullName}
              </Text>
              {item.verified && (
                <View style={styles.eliteBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#fff" />
                  <Text style={styles.eliteBadgeText}>ELITE</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCountText}>
                ({item.reviewCount} sharh)
              </Text>
            </View>

            {item.city && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.textMuted}
                />
                <Text style={styles.locationText}>{item.city}</Text>
              </View>
            )}
          </View>

          {/* Bookmark */}
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => toggleBookmark(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <View style={styles.categoryChips}>
          {item.categories.map((cat) => (
            <View key={cat.id} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat.name}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.masterCardActions}>
          <TouchableOpacity
            style={styles.callButton}
            activeOpacity={0.8}
            onPress={() => handleCall(item.phone)}
          >
            <Ionicons name="call-outline" size={18} color="#fff" />
            <Text style={styles.callButtonText}>Bog'lanish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push(`/usta/${item.id}`)}
          >
            <Text style={styles.profileButtonText}>Profil</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerLabel}>KATALOG</Text>
          <Text style={styles.headerTitle}>
            Eng sara ustalar sizning xizmatingizda
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() =>
                setActiveFilter(isActive ? null : chip.key)
              }
            >
              <Ionicons
                name={chip.icon}
                size={16}
                color={isActive ? "#fff" : COLORS.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={isActive ? "#fff" : COLORS.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Masters list */}
      <FlatList
        data={masters}
        keyExtractor={(item) => item.id}
        renderItem={renderMasterCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {loading ? "Yuklanmoqda..." : `${masters.length} ta usta topildi`}
          </Text>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
          ) : (
            <Text style={[styles.resultCount, { textAlign: "center", marginTop: 40 }]}>
              Hozircha usta topilmadi
            </Text>
          )
        }
      />
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
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    lineHeight: 28,
  },
  filtersScroll: {
    maxHeight: 48,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 12,
  },
  masterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  masterCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  masterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  masterName: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    flexShrink: 1,
  },
  eliteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  eliteBadgeText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  reviewCountText: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  bookmarkButton: {
    padding: 4,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textSecondary,
  },
  masterCardActions: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: "#fff",
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "10",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  profileButtonText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
});
