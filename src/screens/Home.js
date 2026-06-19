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
    iconBg: Colors.primary,
    screen: "MatchFeed",
    disabled: false,
  },
  {
    id: "challenge-friend",
    title: "Challenge a Friend",
    subtitle: "Invite someone directly",
    icon: "people-outline",
    iconBg: "#7C3AED",
    screen: "Challenge-Match",
    disabled: false,
  },
  {
    id: "my-requests",
    title: "Requests & Rooms",
    subtitle: "Invites and rooms you're in",
    icon: "mail-outline",
    iconBg: Colors.success,
    screen: "Requests",
    disabled: false,
  },
  {
    id: "my-matches",
    title: "My Matches",
    subtitle: "History and live games",
    icon: "trophy-outline",
    iconBg: Colors.warning,
    screen: "MatchHistory",
    disabled: false,
  },
  {
    id: "tournaments",
    title: "Tournaments",
    subtitle: "Compete in organised brackets",
    icon: "medal-outline",
    iconBg: Colors.comingSoon,
    screen: null,
    disabled: true,
    badge: "Coming Soon",
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

  const firstName =
    user?.name?.split(" ")?.[0] ||
    user?.firstName ||
    "Player";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
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

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          <Ionicons name="flash-outline" size={15} color={Colors.primary} />
          <Text style={styles.statsText}> Tap a card to get started</Text>
        </View>

        {/* ── Action Cards ── */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        {ACTION_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, card.disabled && styles.cardDisabled]}
            onPress={() => handleCardPress(card)}
            activeOpacity={card.disabled ? 0.7 : 0.85}
            accessibilityLabel={card.title}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: card.disabled ? Colors.comingSoon : card.iconBg + "22" },
              ]}
            >
              <Ionicons
                name={card.icon}
                size={26}
                color={card.disabled ? Colors.comingSoonText : card.iconBg}
              />
            </View>

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
                size={18}
                color={Colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>BadmintonConnect · v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },

  // Section label
  sectionLabel: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  // Action card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardDisabled: {
    opacity: 0.7,
    backgroundColor: Colors.surfaceElevated,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.semiBold,
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
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.comingSoonText,
  },

  footer: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
});
