import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function PublicProfile({ route, navigation }) {
  const { userId } = route.params;
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api(`/profile/${userId}`),
          api(`/profile/${userId}/stats`),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
        } else {
          throw new Error("Failed to load profile data");
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not load this player's profile.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[Colors.background, "#111827"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Player Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {profile?.profilePictureUrl ? (
                <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.firstName?.[0] || "?").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.nameText}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            
            <View style={styles.tagWrap}>
              <View style={styles.tag}>
                <Ionicons name="location" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>{profile?.homeCity || "Unknown City"}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="male-female" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>{profile?.genderEnum}</Text>
              </View>
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.matchesPlayed ?? "—"}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats ? `${Math.round(stats.winRate)}%` : "—"}
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.trustScore ?? "—"}</Text>
              <Text style={styles.statLabel}>Trust Score</Text>
            </View>
          </View>

          {/* Connect CTA */}
          <TouchableOpacity style={styles.connectBtn} activeOpacity={0.8} onPress={() => {
              Alert.alert("Messages", "Direct messaging is coming soon!");
          }}>
            <LinearGradient colors={Colors.accentPurple} style={styles.connectBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.connectBtnText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>
          
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientBg: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  // Profile Card
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    ...Shadow.glow,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  nameText: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagWrap: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 217, 245, 0.1)",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(0, 217, 245, 0.2)",
  },
  tagText: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
  },

  connectBtn: {
    marginTop: Spacing.xl,
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.md,
  },
  connectBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },

  // Stats row
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.extraBold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
});
