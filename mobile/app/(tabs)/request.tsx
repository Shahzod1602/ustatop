import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { COLORS, CITIES, URGENCY_OPTIONS } from "../../lib/constants";

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function RequestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const target = ((step + 1) / 3) * 100;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  async function fetchCategories() {
    try {
      const data = await api<Category[]>("/api/categories");
      setCategories(data);
    } catch {
      Alert.alert("Xatolik", "Kategoriyalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoadingCategories(false);
    }
  }

  function canGoNext(): boolean {
    if (step === 0) return !!selectedCategory;
    if (step === 1) return title.trim().length > 0 && description.trim().length > 0;
    if (step === 2)
      return (
        name.trim().length > 0 &&
        phone.trim().length > 0 &&
        address.trim().length > 0
      );
    return false;
  }

  async function handleSubmit() {
    if (!canGoNext()) return;
    setSubmitting(true);
    try {
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          categoryId: selectedCategory?.id,
          title: title.trim(),
          description: description.trim(),
          urgency,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          address: address.trim(),
          city,
        }),
      });
      Alert.alert("Muvaffaqiyat!", "So'rovingiz muvaffaqiyatli yuborildi.", [
        { text: "OK", onPress: () => router.push("/(tabs)/my-requests") },
      ]);
    } catch {
      Alert.alert("Xatolik", "So'rovni yuborishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const completionPercent = Math.round(((step + 1) / 3) * 100);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // --- Step 0: Category selection ---
  function renderStepCategory() {
    if (loadingCategories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryCard,
              selectedCategory?.id === cat.id && styles.categoryCardSelected,
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.categoryIconWrap,
                selectedCategory?.id === cat.id && styles.categoryIconWrapSelected,
              ]}
            >
              <Ionicons
                name="construct-outline"
                size={28}
                color={selectedCategory?.id === cat.id ? "#fff" : COLORS.primary}
              />
            </View>
            <Text
              style={[
                styles.categoryName,
                selectedCategory?.id === cat.id && styles.categoryNameSelected,
              ]}
              numberOfLines={2}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // --- Step 1: Details ---
  function renderStepDetails() {
    return (
      <View>
        {selectedCategory && (
          <View style={styles.selectedCategoryCard}>
            <View style={styles.selectedCategoryLeft}>
              <View style={styles.selectedCategoryIcon}>
                <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(0)}>
              <Text style={styles.changeText}>O'zgartirish</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.inputLabel}>SARLAVHA</Text>
        <TextInput
          style={styles.input}
          placeholder="Masalan: Santexnik kerak"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>TAVSIF</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Muammoni batafsil yozing..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>SHOSHILINCHLIK DARAJASI</Text>
        <View style={styles.urgencyContainer}>
          {URGENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.urgencyCard,
                urgency === opt.value && styles.urgencyCardSelected,
              ]}
              onPress={() => setUrgency(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.urgencyEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.urgencyLabel,
                  urgency === opt.value && styles.urgencyLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
              <Text style={styles.urgencyDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // --- Step 2: Contact ---
  function renderStepContact() {
    return (
      <View>
        <Text style={styles.inputLabel}>ISM</Text>
        <TextInput
          style={styles.input}
          placeholder="To'liq ismingiz"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>TELEFON</Text>
        <TextInput
          style={styles.input}
          placeholder="+998 90 123 45 67"
          placeholderTextColor={COLORS.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>MANZIL</Text>
        <TextInput
          style={styles.input}
          placeholder="Ko'cha, uy raqami"
          placeholderTextColor={COLORS.textMuted}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.inputLabel}>SHAHAR</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCityModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>{city}</Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Modal
          visible={cityModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCityModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCityModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SHAHARNI TANLANG</Text>
              <ScrollView>
                {CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityItem, city === c && styles.cityItemSelected]}
                    onPress={() => {
                      setCity(c);
                      setCityModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityItemText,
                        city === c && styles.cityItemTextSelected,
                      ]}
                    >
                      {c}
                    </Text>
                    {city === c && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  const stepTitles = ["Kategoriya tanlang", "Tafsilotlar", "Aloqa ma'lumotlari"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header with step indicator */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>QADAM {step + 1}/3</Text>
            </View>
            <Text style={styles.completionText}>{completionPercent}% tayyor</Text>
          </View>
          <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Step content */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && renderStepCategory()}
          {step === 1 && renderStepDetails()}
          {step === 2 && renderStepContact()}
        </ScrollView>

        {/* Bottom navigation buttons */}
        <View style={styles.bottomBar}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Orqaga</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, !canGoNext() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canGoNext() || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 2 ? "Yuborish" : "Keyingisi"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1.5,
  },
  completionText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textMuted,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: "center",
  },

  // Category grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff5f0",
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff0e6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIconWrapSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: COLORS.primary,
  },

  // Selected category card (step 1)
  selectedCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  selectedCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff0e6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectedCategoryText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  changeText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },

  // Inputs
  inputLabel: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textarea: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },

  // Urgency
  urgencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  urgencyCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  urgencyCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff5f0",
  },
  urgencyEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  urgencyLabel: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  urgencyLabelSelected: {
    color: COLORS.primary,
  },
  urgencyDesc: {
    fontSize: 11,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },

  // City picker
  pickerButton: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: "center",
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cityItemSelected: {
    backgroundColor: "#fff5f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  cityItemText: {
    fontSize: 16,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  cityItemTextSelected: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 110,
    alignItems: "center",
  },
  backButtonPlaceholder: {
    minWidth: 110,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 130,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
});
