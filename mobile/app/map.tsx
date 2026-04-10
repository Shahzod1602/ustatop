import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { COLORS } from "../lib/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Category {
  id: string;
  name: string;
}

interface Master {
  id: string;
  name: string;
  photo?: string;
  rating?: number;
  categoryId?: string;
  categoryName?: string;
  lat: number;
  lng: number;
  phone?: string;
}

const DEFAULT_REGION: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initLocation();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchMasters();
    }
  }, [userLocation, activeCategory]);

  async function initLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat", "Joylashuv ruxsati berilmadi");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch {
      Alert.alert("Xatolik", "Joylashuvni aniqlab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const data = await api<Category[]>("/api/categories");
      setCategories(data);
    } catch {
      // silent
    }
  }

  async function fetchMasters() {
    if (!userLocation) return;
    try {
      let url = `/api/masters/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=7`;
      if (activeCategory) {
        url += `&categoryId=${activeCategory}`;
      }
      const data = await api<Master[]>(url);
      setMasters(data);
    } catch {
      // silent
    }
  }

  function handleGoToMyLocation() {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  }

  function handleCategoryPress(catId: string | null) {
    setActiveCategory(catId);
    setSelectedMaster(null);
  }

  function handleMarkerPress(master: Master) {
    setSelectedMaster(master);
  }

  function handleProfilePress() {
    if (!selectedMaster) return;
    router.push(`/usta/${selectedMaster.id}` as any);
  }

  const initialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Xarita yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedMaster(null)}
      >
        {masters.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            onPress={() => handleMarkerPress(m)}
          >
            <View
              style={[
                styles.markerContainer,
                selectedMaster?.id === m.id && styles.markerContainerSelected,
              ]}
            >
              <Ionicons
                name="construct"
                size={18}
                color={selectedMaster?.id === m.id ? "#fff" : COLORS.primary}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Back button */}
      <SafeAreaView style={styles.topOverlay} edges={["top"]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Category filter chips */}
      <SafeAreaView style={styles.chipsOverlay} edges={["top"]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, !activeCategory && styles.chipActive]}
            onPress={() => handleCategoryPress(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>
              Hammasi
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                activeCategory === cat.id && styles.chipActive,
              ]}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === cat.id && styles.chipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* My location button */}
      <TouchableOpacity
        style={styles.myLocationBtn}
        onPress={handleGoToMyLocation}
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={22} color={COLORS.primary} />
        <Text style={styles.myLocationText}>Menga yaqin</Text>
      </TouchableOpacity>

      {/* Selected master popup */}
      {selectedMaster && (
        <View style={styles.masterPopup}>
          <View style={styles.masterPopupInner}>
            <View style={styles.masterPhotoWrap}>
              {selectedMaster.photo ? (
                <Image
                  source={{ uri: selectedMaster.photo }}
                  style={styles.masterPhoto}
                />
              ) : (
                <View style={styles.masterPhotoPlaceholder}>
                  <Ionicons name="person" size={28} color={COLORS.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.masterInfo}>
              <Text style={styles.masterName} numberOfLines={1}>
                {selectedMaster.name}
              </Text>
              {selectedMaster.categoryName && (
                <Text style={styles.masterCategory}>
                  {selectedMaster.categoryName}
                </Text>
              )}
              <View style={styles.masterRatingRow}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.masterRating}>
                  {selectedMaster.rating?.toFixed(1) ?? "—"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.masterPopupActions}>
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={18} color="#fff" />
              <Text style={styles.contactBtnText}>Bog'lanish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              <Text style={styles.profileBtnText}>Profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
  },

  // Top overlay
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Category chips
  chipsOverlay: {
    position: "absolute",
    top: 0,
    left: 68,
    right: 0,
    zIndex: 10,
  },
  chipsContent: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
  },
  chipTextActive: {
    color: "#fff",
  },

  // Markers
  markerContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff0e6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },

  // My location button
  myLocationBtn: {
    position: "absolute",
    bottom: 130,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  myLocationText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Master popup
  masterPopup: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  masterPopupInner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  masterPhotoWrap: {
    marginRight: 14,
  },
  masterPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  masterPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  masterInfo: {
    flex: 1,
  },
  masterName: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  masterCategory: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  masterRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  masterRating: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.text,
    marginLeft: 4,
  },
  masterPopupActions: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    marginLeft: 6,
  },
  profileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff0e6",
    paddingVertical: 12,
    borderRadius: 14,
  },
  profileBtnText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
    marginLeft: 6,
  },
});
