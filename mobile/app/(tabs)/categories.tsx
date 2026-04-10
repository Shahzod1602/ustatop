import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - CARD_GAP) / 2;

interface Category {
  id: string;
  name: string;
  icon?: string;
  _count?: { masters?: number };
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  plumbing: "water-outline",
  electric: "flash-outline",
  cleaning: "sparkles-outline",
  painting: "color-palette-outline",
  carpentry: "hammer-outline",
  ac: "snow-outline",
  locksmith: "key-outline",
  welding: "construct-outline",
  default: "build-outline",
};

function getCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes("santexnik") || lower.includes("suv")) return "water-outline";
  if (lower.includes("elektr")) return "flash-outline";
  if (lower.includes("tozala")) return "sparkles-outline";
  if (lower.includes("bo'ya") || lower.includes("remont")) return "color-palette-outline";
  if (lower.includes("duradgor") || lower.includes("yog'och")) return "hammer-outline";
  if (lower.includes("konditsi")) return "snow-outline";
  if (lower.includes("qulf") || lower.includes("kalit")) return "key-outline";
  if (lower.includes("payvand") || lower.includes("svarka")) return "construct-outline";
  if (lower.includes("mebel")) return "bed-outline";
  if (lower.includes("plitkachi") || lower.includes("plitka")) return "grid-outline";
  return "build-outline";
}

const CATEGORY_COLORS = [
  "#ff6b2b",
  "#3b82f6",
  "#16a34a",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#ef4444",
  "#06b6d4",
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await api<Category[]>("/api/categories");
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const featured = categories[0];

  function handlePress(category: Category) {
    router.push({
      pathname: "/(tabs)/request",
      params: { categoryId: category.id, categoryName: category.name },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Xizmatlar</Text>
          <Text style={styles.subtitle}>
            O'zingizga kerakli usta turini tanlang
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Kategoriyani qidiring..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Featured Card */}
            {featured && !search && (
              <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.85}
                onPress={() => handlePress(featured)}
              >
                <View style={styles.featuredContent}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>OMMABOP</Text>
                  </View>
                  <View style={styles.featuredIconWrap}>
                    <Ionicons
                      name={getCategoryIcon(featured.name)}
                      size={40}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.featuredTitle}>{featured.name}</Text>
                  <Text style={styles.featuredSubtitle}>
                    {featured._count?.masters ?? 120}+ professional usta
                  </Text>
                </View>
                <View style={styles.featuredDecoCircle1} />
                <View style={styles.featuredDecoCircle2} />
              </TouchableOpacity>
            )}

            {/* Grid */}
            <View style={styles.grid}>
              {filtered.map((cat, index) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => handlePress(cat)}
                >
                  <View
                    style={[
                      styles.cardIconWrap,
                      {
                        backgroundColor:
                          CATEGORY_COLORS[index % CATEGORY_COLORS.length] + "15",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat.name)}
                      size={28}
                      color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <Text style={styles.cardCount}>
                    {cat._count?.masters ?? 0} usta
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filtered.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyText}>Kategoriya topilmadi</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 50,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.text,
    height: 48,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  featuredCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  },
  featuredContent: {
    zIndex: 1,
  },
  featuredBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  featuredIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featuredTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  featuredDecoCircle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -30,
    right: -20,
  },
  featuredDecoCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -20,
    right: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: CARD_GAP,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardName: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
    marginTop: 12,
  },
});
