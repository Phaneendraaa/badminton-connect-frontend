import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const { width } = Dimensions.get("window");

const ACTION_CARDS = [
  {
    id: "open-matches",
    title: "Open Matches",
    subtitle: "Find and join public games",
    icon: "search-outline",
    gradient: Colors.accentGreen,
    screen: "MatchFeed",
    disabled: false,
    iconColor: Colors.textInverse,
  },
  {
    id: "challenge-friend",
    title: "Challenge a Friend",
    subtitle: "Invite someone directly",
    icon: "people-outline",
    gradient: Colors.accentPurple,
    screen: "Challenge-Match",
    disabled: false,
    iconColor: "#FFFFFF",
  },
  {
    id: "my-requests",
    title: "Requests & Rooms",
    subtitle: "Invites and rooms you're in",
    icon: "mail-outline",
    gradient: ['#10B981', '#059669'],
    screen: "Requests",
    disabled: false,
    iconColor: "#FFFFFF",
  },
  {
    id: "my-matches",
    title: "My Matches",
    subtitle: "History and live games",
    icon: "trophy-outline",
    gradient: Colors.accentOrange,
    screen: "MatchHistory",
    disabled: false,
    iconColor: "#FFFFFF",
  },
  {
    id: "tournaments",
    title: "Tournaments",
    subtitle: "Compete in organised brackets",
    icon: "medal-outline",
    gradient: ['#1E293B', '#0F172A'],
    screen: null,
    disabled: true,
    badge: "Coming Soon",
    iconColor: Colors.comingSoonText,
  },
];

export default function Home({ navigation }) {
  const { user, logout, isNewUser } = useAuth();

  useEffect(() => {
    if (isNewUser) {
      navigation.navigate("Profile-create");
    }
  }, []);

  const handleCardPress = (card) => {
    if (card.disabled) {
      Alert.alert("Tournaments", "Tournaments are coming soon — stay tuned! 🏆");
      return;
    }
    navigation.navigate(card.screen);
  };

  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "there";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[Colors.background, "#111827"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
              <Text style={styles.subGreeting}>Ready to play?</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() =>
                Alert.alert("Logout", "Are you sure you want to logout?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: logout },
                ])
              }
              accessibilityLabel="Logout button"
            >
              <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Glowing Stats Strip / Instruction */}
          <View style={styles.statsStripBorder}>
            <LinearGradient
              colors={['rgba(0, 245, 160, 0.12)', 'rgba(0, 217, 245, 0.04)']}
              style={styles.statsStrip}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash-outline" size={16} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.statsText}>Welcome to BadmintonConnect! Choose an action below to get started.</Text>
            </LinearGradient>
          </View>

          {/* Section Label */}
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

          {/* Action Cards */}
          {ACTION_CARDS.map((card) => {
            const CardComponent = card.disabled ? View : TouchableOpacity;
            const cardProps = card.disabled
              ? {}
              : {
                  onPress: () => handleCardPress(card),
                  activeOpacity: 0.85,
                  accessibilityLabel: card.title,
                };

            return (
              <CardComponent
                key={card.id}
                style={[
                  styles.cardBorder,
                  card.disabled && styles.cardDisabledBorder,
                ]}
                {...cardProps}
              >
                <LinearGradient
                  colors={card.disabled ? ['#13192B', '#0E1321'] : ['#1E2540', '#121829']}
                  style={styles.cardInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={card.gradient}
                    style={styles.iconWrap}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={card.icon}
                      size={26}
                      color={card.iconColor}
                    />
                  </LinearGradient>

                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, card.disabled && styles.disabledText]}>
                      {card.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, card.disabled && styles.disabledText]}>
                      {card.subtitle}
                    </Text>
                  </View>

                  {card.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{card.badge}</Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textTertiary}
                    />
                  )}
                </LinearGradient>
              </CardComponent>
            );
          })}

          <View style={styles.footer}>
            <Text style={styles.footerText}>BadmintonConnect · v1.0</Text>
          </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.h1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Stats strip
  statsStripBorder: {
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    marginBottom: Spacing.lg,
    ...Shadow.glow,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  statsText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },

  // Action card border wrap
  cardBorder: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadow.md,
  },
  cardDisabledBorder: {
    borderColor: Colors.borderLight,
    opacity: 0.5,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  disabledText: {
    color: Colors.disabledText,
  },

  // Coming Soon badge
  badge: {
    backgroundColor: Colors.comingSoon,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.comingSoonText,
  },

  footer: {
    marginTop: Spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
});
