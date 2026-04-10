import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { COLORS } from "../../lib/constants";

const ROLE_LABELS: Record<string, string> = {
  MASTER: "Usta",
  CUSTOMER: "Mijoz",
  ADMIN: "Admin",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login" as any);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kabinet</Text>
        </View>

        <View style={styles.guestCard}>
          <View style={styles.guestIconContainer}>
            <Ionicons name="person-outline" size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.guestTitle}>Tizimga kirilmagan</Text>
          <Text style={styles.guestSubtitle}>
            So'rov yuborish va ustalarni ko'rish uchun tizimga kiring
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={() => router.push("/auth/login" as any)}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Kirish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={() => router.push("/auth/register" as any)}
          >
            <Text style={styles.registerButtonText}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kabinet</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuText}>Profilni tahrirlash</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/my-requests" as any)}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.menuText}>Mening so'rovlarim</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.menuText}>Sozlamalar</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.menuText}>Yordam</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Chiqish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.text,
  },
  // Guest state
  guestCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  guestIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
    width: "100%",
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  registerButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.primary,
  },
  // User card
  userCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textMuted,
  },
  // Menu
  menuSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    color: COLORS.text,
  },
  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.danger,
  },
});
