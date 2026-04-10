import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { COLORS } from "../../lib/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Category {
  id: string;
  nameUz: string;
  icon?: string;
  _count?: { masters: number };
}

const STEPS = [
  {
    number: "1",
    title: "So'rov yuboring",
    description: "Qanday xizmat kerakligini yozing",
    icon: "create-outline" as const,
  },
  {
    number: "2",
    title: "Usta topiladi",
    description: "Sizga mos ustalar taklif yuboradi",
    icon: "people-outline" as const,
  },
  {
    number: "3",
    title: "Ish bajariladi",
    description: "Ustani tanlang va ishni boshlang",
    icon: "checkmark-circle-outline" as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await api<Category[]>("/api/categories");
      setCategories(data);
    } catch {
      // silently fail
    } finally {
      setLoadingCategories(false);
    }
  }

  function renderCategoryCard({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) {
    const isFirst = index === 0;
    return (
      <TouchableOpacity
        style={[styles.categoryCard, isFirst && styles.categoryCardHighlight]}
        activeOpacity={0.7}
        onPress={() => router.push("/ustalar" as any)}
      >
        <View
          style={[
            styles.categoryIcon,
            isFirst && styles.categoryIconHighlight,
          ]}
        >
          <Ionicons
            name="construct-outline"
            size={24}
            color={isFirst ? "#fff" : COLORS.primary}
          />
        </View>
        <Text
          style={[styles.categoryName, isFirst && styles.categoryNameHighlight]}
          numberOfLines={2}
        >
          {item.nameUz}
        </Text>
        <Text
          style={[
            styles.categoryCount,
            isFirst && styles.categoryCountHighlight,
          ]}
        >
          {item._count?.masters ?? 0} usta
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>UstaTop</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile" as any)}
          >
            <Ionicons name="person" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Ishonchli usta{"\n"}qidirish xizmati
        </Text>
        <Text style={styles.heroSubtitle}>
          O'zbekiston bo'ylab professional ustalar
        </Text>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.7}
        onPress={() => router.push("/ustalar" as any)}
      >
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Qanday xizmat kerak?</Text>
      </TouchableOpacity>

      {/* Popular Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mashhur xizmatlar</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/categories" as any)}>
            <Text style={styles.seeAll}>Barchasi</Text>
          </TouchableOpacity>
        </View>

        {loadingCategories ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        )}
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qanday ishlaydi?</Text>
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <View key={step.number} style={styles.stepCard}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>{step.number}</Text>
              </View>
              <Ionicons
                name={step.icon}
                size={28}
                color={COLORS.primary}
                style={styles.stepIcon}
              />
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              {index < STEPS.length - 1 && (
                <View style={styles.stepConnector} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/request" as any)}
      >
        <Text style={styles.ctaText}>Hoziroq so'rov yuboring</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 60,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 26,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    marginTop: 8,
  },
  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  // Section
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
  loader: {
    paddingVertical: 20,
  },
  // Categories
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: 130,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCardHighlight: {
    backgroundColor: COLORS.primary,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIconHighlight: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  categoryName: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryNameHighlight: {
    color: "#fff",
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  categoryCountHighlight: {
    color: "rgba(255,255,255,0.8)",
  },
  // Steps
  stepsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  stepCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  stepIcon: {
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    flex: 1,
  },
  stepDescription: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    marginTop: 8,
    width: "100%",
    paddingLeft: 44,
  },
  stepConnector: {
    position: "absolute",
    left: 35,
    bottom: -16,
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
  },
  // CTA
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  bottomSpacer: {
    height: 32,
  },
});
