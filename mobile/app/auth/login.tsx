import React, { useState } from "react";
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
import { useAuth } from "../../lib/auth-context";
import { login } from "../../lib/api";
import { COLORS } from "../../lib/constants";

type Role = "CUSTOMER" | "MASTER";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();

  const [role, setRole] = useState<Role>("CUSTOMER");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert("Xatolik", "Telefon raqam va parolni kiriting");
      return;
    }

    setLoading(true);
    try {
      const provider =
        role === "MASTER" ? "credentials" : "customer-credentials";
      const result = await login(provider, phone.trim(), password);

      if (!result.ok) {
        Alert.alert("Xatolik", result.error ?? "Tizimga kirishda xatolik");
        return;
      }

      await auth.refresh();

      if (role === "MASTER") {
        router.replace("/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Xatolik", err.message ?? "Kutilmagan xatolik");
    } finally {
      setLoading(false);
    }
  };

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
            Xush kelibsiz! Tizimga kiring va eng yaxshi mutaxassislarni toping.
          </Text>

          {/* Decorative area */}
          <View style={styles.decorativeArea}>
            <View style={styles.decorativeInner}>
              <Text style={styles.decorativeEmoji}>&#x1F3E0;</Text>
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
                onPress={() => setRole("CUSTOMER")}
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
                onPress={() => setRole("MASTER")}
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

            {/* Phone Input */}
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

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PAROL</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Parolingizni kiriting"
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

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Kirish</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Hisobingiz yo'qmi? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Ro'yxatdan o'tish</Text>
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
    height: 120,
    borderRadius: 20,
    backgroundColor: "#4ecdc4",
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  decorativeInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeEmoji: {
    fontSize: 28,
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
    marginBottom: 24,
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
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#ffffff",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
});
