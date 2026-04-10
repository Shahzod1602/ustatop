import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  author?: {
    fullName: string;
  };
}

interface MasterProfile {
  id: string;
  fullName: string;
  phone?: string;
  bio?: string;
  image?: string;
  rating: number;
  reviewCount: number;
  city?: string;
  serviceArea?: string;
  verified: boolean;
  categories: { id: string; name: string }[];
  reviews?: Review[];
}

const AVATAR_COLORS = [
  "#ff6b2b",
  "#3b82f6",
  "#16a34a",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
  ];
  return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function renderStars(rating: number) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? "star" : "star-outline"}
        size={14}
        color="#f59e0b"
      />
    );
  }
  return stars;
}

export default function MasterProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [master, setMaster] = useState<MasterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    loadMaster();
  }, [id]);

  async function loadMaster() {
    try {
      setLoading(true);
      setError(null);
      const data = await api<MasterProfile>(`/api/masters/${id}`);
      setMaster(data);
    } catch (err: any) {
      console.error("Failed to load master:", err);
      setError(err.message ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  function handleCall() {
    if (!master?.phone) return;
    Linking.openURL(`tel:${master.phone}`);
  }

  async function handleShare() {
    if (!master) return;
    try {
      await Share.share({
        message: `${master.fullName} - UstaTop'da professional usta. https://ustatop.identify.uz/ustalar/${master.id}`,
      });
    } catch {}
  }

  const avatarColor = AVATAR_COLORS[
    ((id?.charCodeAt(0) ?? 0) + (id?.charCodeAt(1) ?? 0)) % AVATAR_COLORS.length
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error || !master) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <TouchableOpacity
          style={styles.errorBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Usta topilmadi</Text>
          <Text style={styles.errorText}>{error ?? "Ma'lumot yuklanmadi"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMaster}>
            <Text style={styles.retryButtonText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          {master.image ? (
            <Image
              source={{ uri: master.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.heroInitials}>
                {getInitials(master.fullName)}
              </Text>
            </View>
          )}

          {/* Overlay gradient */}
          <View style={styles.heroOverlayTop} />

          {/* Navigation buttons */}
          <SafeAreaView style={styles.heroNav} edges={["top"]}>
            <TouchableOpacity
              style={styles.heroNavButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroNavButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Profile Card - overlapping hero */}
        <View style={styles.profileCard}>
          {/* Name & Badge */}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.masterName}>{master.fullName}</Text>
              {master.verified && (
                <View style={styles.proBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <View style={styles.starsRow}>{renderStars(master.rating)}</View>
              <Text style={styles.ratingValue}>{master.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({master.reviewCount} sharh)
              </Text>
            </View>
          </View>

          {/* Categories */}
          {master.categories.length > 0 && (
            <View style={styles.categoriesSection}>
              <View style={styles.categoryChips}>
                {master.categories.map((cat) => (
                  <View key={cat.id} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bio */}
          {master.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>Haqida</Text>
              <Text style={styles.bioText}>{master.bio}</Text>
            </View>
          )}

          {/* Service Area */}
          {(master.serviceArea || master.city) && (
            <View style={styles.serviceAreaSection}>
              <Text style={styles.sectionTitle}>
                Xizmat ko'rsatish hududi
              </Text>
              <View style={styles.serviceAreaRow}>
                <View style={styles.serviceAreaIconWrap}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.serviceAreaText}>
                  {master.serviceArea ?? master.city}
                </Text>
              </View>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{master.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Reyting</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{master.reviewCount}</Text>
              <Text style={styles.statLabel}>Sharhlar</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {master.categories.length}
              </Text>
              <Text style={styles.statLabel}>Xizmatlar</Text>
            </View>
          </View>

          {/* Reviews */}
          {master.reviews && master.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Sharhlar</Text>
              {master.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthorAvatar}>
                      <Text style={styles.reviewAuthorInitial}>
                        {review.author?.fullName?.[0] ?? "?"}
                      </Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewAuthorName}>
                        {review.author?.fullName ?? "Foydalanuvchi"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Bottom spacer for fixed button */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <SafeAreaView edges={["bottom"]} style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.bookmarkBottomButton}
            onPress={() => setBookmarked(!bookmarked)}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color={bookmarked ? COLORS.primary : COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.85}
            onPress={handleCall}
          >
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>BOG'LANISH</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBackButton: {
    marginTop: 16,
    marginLeft: 24,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
  },
  retryButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: "#fff",
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInitials: {
    fontSize: 64,
    fontFamily: "Manrope_700Bold",
    color: "rgba(255,255,255,0.6)",
  },
  heroOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: 0.8,
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
    minHeight: SCREEN_HEIGHT - HERO_HEIGHT + 28,
  },
  nameSection: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  masterName: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    flexShrink: 1,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingValue: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },

  // Categories
  categoriesSection: {
    marginBottom: 20,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },

  // Bio
  bioSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Service Area
  serviceAreaSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceAreaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceAreaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceAreaText: {
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textSecondary,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },

  // Reviews
  reviewsSection: {
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAuthorInitial: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
  },
  reviewMeta: {
    flex: 1,
    marginLeft: 10,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 1,
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  bottomSpacer: {
    height: 100,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  bookmarkBottomButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
});
