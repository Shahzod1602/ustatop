import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { register, api } from "../../lib/api";
import { COLORS, CITIES } from "../../lib/constants";

type Role = "CUSTOMER" | "MASTER";

interface Category {
  id: string;
  name: string;
}

export default function RegisterScreen() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("CUSTOMER");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Master-only fields (step 2)
  const [city, setCity] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api<Category[]>("/api/categories");
      setCategories(data);
    } catch {
      // Categories will be empty, user can still register
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const validateStep1 = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert("Xatolik", "Ism-familiyangizni kiriting");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Xatolik", "Telefon raqamingizni kiriting");
      return false;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert("Xatolik", "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep1()) return;

    if (role === "MASTER" && step === 2) {
      if (!city) {
        Alert.alert("Xatolik", "Shaharni tanlang");
        return;
      }
      if (selectedCategories.length === 0) {
        Alert.alert("Xatolik", "Kamida bitta kategoriya tanlang");
        return;
      }
    }

    setLoading(true);
    try {
      const data: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        role,
      };

      if (role === "MASTER") {
        data.serviceArea = city;
        data.categories = selectedCategories;
        data.bio = bio.trim();
      }

      const result = await register(data);

      if (!result.ok) {
        Alert.alert("Xatolik", result.error ?? "Ro'yxatdan o'tishda xatolik");
        return;
      }

      Alert.alert("Muvaffaqiyat", "Ro'yxatdan o'tdingiz! Tizimga kiring.", [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Xatolik", err.message ?? "Kutilmagan xatolik");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>ISM-FAMILIYA</Text>
        <TextInput
          style={styles.input}
          placeholder="To'liq ismingiz"
          placeholderTextColor={COLORS.textMuted}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      {/* Phone */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>TELEFON RAQAMI</Text>
        <TextInput
          style={styles.input}
          placeholder="+998XXXXXXXXX"
          placeholderTextColor={COLORS.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>PAROL</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Kamida 6 ta belgi"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>
              {showPassword ? "Yashirish" : "Ko'rish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Button */}
      {role === "MASTER" ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Keyingisi</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Ro'yxatdan o'tish</Text>
          )}
        </TouchableOpacity>
      )}
    </>
  );

  const renderStep2 = () => (
    <>
      {/* City Picker */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>SHAHAR</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Text
            style={[
              styles.pickerText,
              !city && styles.pickerPlaceholder,
            ]}
          >
            {city || "Shaharni tanlang"}
          </Text>
        </TouchableOpacity>
        {showCityPicker && (
          <View style={styles.pickerDropdown}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.pickerOption,
                  city === c && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setCity(c);
                  setShowCityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    city === c && styles.pickerOptionTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Categories */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>KATEGORIYALAR</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {categories.length === 0 && (
            <Text style={styles.emptyText}>
              Kategoriyalar yuklanmoqda...
            </Text>
          )}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>O'ZINGIZ HAQINGIZDA</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tajribangiz va ko'nikmalaringiz haqida qisqacha yozing..."
          placeholderTextColor={COLORS.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>Orqaga</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            styles.flexButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Ro'yxatdan o'tish</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>UstaTop</Text>
          <Text style={styles.subtitle}>
            {role === "CUSTOMER"
              ? "Yangi hisob yarating va eng yaxshi ustalarni toping."
              : "Usta sifatida ro'yxatdan o'ting va buyurtmalar oling."}
          </Text>

          {/* Decorative area */}
          <View style={styles.decorativeArea}>
            <View style={styles.decorativeInner}>
              <Text style={styles.decorativeEmoji}>&#x1F6E0;</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Role Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  role === "CUSTOMER" && styles.tabActive,
                ]}
                onPress={() => {
                  setRole("CUSTOMER");
                  setStep(1);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    role === "CUSTOMER" && styles.tabTextActive,
                  ]}
                >
                  Mijoz
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  role === "MASTER" && styles.tabActive,
                ]}
                onPress={() => {
                  setRole("MASTER");
                  setStep(1);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    role === "MASTER" && styles.tabTextActive,
                  ]}
                >
                  Usta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step indicator for Master */}
            {role === "MASTER" && (
              <View style={styles.stepIndicator}>
                <View
                  style={[
                    styles.stepDot,
                    step >= 1 && styles.stepDotActive,
                  ]}
                />
                <View style={styles.stepLine} />
                <View
                  style={[
                    styles.stepDot,
                    step >= 2 && styles.stepDotActive,
                  ]}
                />
              </View>
            )}

            {/* Form */}
            {step === 1 ? renderStep1() : renderStep2()}

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Hisobingiz bormi? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Kirish</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  decorativeArea: {
    width: "100%",
    height: 100,
    borderRadius: 20,
    backgroundColor: "#4ecdc4",
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  decorativeInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeEmoji: {
    fontSize: 24,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBg,
    borderRadius: 50,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 50,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
  textArea: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
    minHeight: 100,
  },
  pickerText: {
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  pickerPlaceholder: {
    color: COLORS.textMuted,
  },
  pickerDropdown: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.inputBg,
  },
  pickerOptionText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  pickerOptionTextActive: {
    color: COLORS.primary,
    fontFamily: "Manrope_700Bold",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "#fff5f0",
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontFamily: "Manrope_700Bold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#ffffff",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textMuted,
  },
  flexButton: {
    flex: 1,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
});
