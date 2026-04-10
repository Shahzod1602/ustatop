import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  name: IoniconsName;
  color: string;
  size: number;
  elevated?: boolean;
}

function TabIcon({ name, color, size, elevated }: TabIconProps) {
  if (elevated) {
    return (
      <View style={styles.elevatedButton}>
        <Ionicons name={name} size={28} color="#fff" />
      </View>
    );
  }
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "CATEGORIES",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="add-circle"
              color={COLORS.primary}
              size={28}
              elevated
            />
          ),
          tabBarLabel: "NEW",
          tabBarLabelStyle: styles.elevatedLabel,
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: "MY REQUESTS",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="clipboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 0.5,
  },
  elevatedButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  elevatedLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
