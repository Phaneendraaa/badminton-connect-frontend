import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const TOURNAMENTS_DATA = [
  {
    id: "1",
    title: "Midnight Smash Singles",
    date: "July 12, 2026",
    time: "08:00 PM",
    category: "Singles (Co-ed)",
    prize: "₹15,000",
    registeredCount: 24,
    maxPlayers: 32,
    status: "REGISTRATION_OPEN",
    gradientColors: [Colors.secondary, "#EC4899"], // Violet to Hot Pink
  },
  {
    id: "2",
    title: "Summer Open Doubles",
    date: "August 02, 2026",
    time: "10:00 AM",
    category: "Doubles (Men/Women)",
    prize: "₹30,000",
    registeredCount: 16,
    maxPlayers: 16,
    status: "FULL",
    gradientColors: [Colors.primary, "#00D9F5"], // Emerald to Cyan
  },
  {
    id: "3",
    title: "Monsoon League Pro-Am",
    date: "September 15, 2026",
    time: "04:00 PM",
    category: "Mixed Doubles",
    prize: "₹50,000",
    registeredCount: 8,
    maxPlayers: 32,
    status: "REGISTRATION_OPEN",
    gradientColors: ["#F59E0B", "#EF4444"], // Amber to Red
  },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: "Aarav Sharma", points: 2850, elo: 1850 },
  { rank: 2, name: "Vikram Malhotra", points: 2600, elo: 1720 },
  { rank: 3, name: "Riya Sen", points: 2450, elo: 1680 },
];

export default function Tournament({ navigation }) {
  const [activeTab, setActiveTab] = useState("tournaments"); // 'tournaments' | 'leaderboard'

  const renderTournamentItem = ({ item }) => {
    const isFull = item.status === "FULL";
    return (
      <View style={styles.card}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.cardHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, isFull ? styles.badgeFull : styles.badgeOpen]}>
              <Text style={styles.badgeText}>
                {isFull ? "FULL" : "OPEN"}
              </Text>
            </View>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.date} at {item.time}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Prize Pool: <Text style={styles.highlightText}>{item.prize}</Text></Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${(item.registeredCount / item.maxPlayers) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.registeredCount}/{item.maxPlayers} Spots Filled
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.btn, isFull && styles.btnDisabled]}
            disabled={isFull}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {isFull ? "Tournament Full" : "Register Now"}
            </Text>
            {!isFull && <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} style={{ marginLeft: Spacing.xs }} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (item) => (
    <View key={item.rank} style={styles.leaderboardRow}>
      <View style={styles.leaderboardLeft}>
        <View style={[
          styles.rankBadge,
          item.rank === 1 && styles.rank1,
          item.rank === 2 && styles.rank2,
          item.rank === 3 && styles.rank3
        ]}>
          <Text style={styles.rankText}>{item.rank}</Text>
        </View>
        <Text style={styles.leaderboardName}>{item.name}</Text>
      </View>
      <View style={styles.leaderboardRight}>
        <Text style={styles.leaderboardPoints}>{item.points} pts</Text>
        <Text style={styles.leaderboardElo}>{item.elo} ELO</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={[Colors.background, "#111827"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tournaments</Text>
          <Text style={styles.headerSubtitle}>Compete in regional leagues & win prizes</Text>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "tournaments" && styles.tabButtonActive]}
            onPress={() => setActiveTab("tournaments")}
          >
            <Text style={[styles.tabButtonText, activeTab === "tournaments" && styles.tabButtonTextActive]}>
              Active & Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "leaderboard" && styles.tabButtonActive]}
            onPress={() => setActiveTab("leaderboard")}
          >
            <Text style={[styles.tabButtonText, activeTab === "leaderboard" && styles.tabButtonTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "tournaments" ? (
          <FlatList
            data={TOURNAMENTS_DATA}
            keyExtractor={(item) => item.id}
            renderItem={renderTournamentItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.leaderboardContainer} showsVerticalScrollIndicator={false}>
            {/* Top Leaderboard Card */}
            <View style={styles.leaderboardCard}>
              <View style={styles.leaderboardCardHeader}>
                <Ionicons name="ribbon-outline" size={24} color={Colors.primary} />
                <Text style={styles.leaderboardCardTitle}>City Leaderboard (Delhi-NCR)</Text>
              </View>
              {LEADERBOARD_DATA.map(renderLeaderboardItem)}
            </View>

            {/* Info Panel */}
            <View style={styles.infoPanel}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.infoPanelText}>
                Rankings are updated daily based on tournament performance and individual match play ELO points. Keep playing to climb the charts!
              </Text>
            </View>
          </ScrollView>
        )}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.h1 - 2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  cardHeaderGradient: {
    padding: Spacing.lg,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  badgeOpen: {
    backgroundColor: "rgba(0, 245, 160, 0.2)",
  },
  badgeFull: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  badgeText: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.medium,
  },
  cardTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardBody: {
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginLeft: Spacing.sm,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  progressRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressText: {
    color: Colors.textTertiary,
    fontSize: Typography.caption,
    textAlign: "right",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.md,
    ...Shadow.glow,
  },
  btnDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },
  leaderboardContainer: {
    padding: Spacing.lg,
  },
  leaderboardCard: {
    backgroundColor: Colors.surfaceGlass,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  leaderboardCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  leaderboardCardTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  leaderboardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rank1: {
    backgroundColor: "#F59E0B",
  },
  rank2: {
    backgroundColor: "#94A3B8",
  },
  rank3: {
    backgroundColor: "#B45309",
  },
  rankText: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  leaderboardName: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  leaderboardRight: {
    alignItems: "flex-end",
  },
  leaderboardPoints: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  leaderboardElo: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoPanel: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  infoPanelText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.caption - 0.5,
    lineHeight: 18,
  },
});
