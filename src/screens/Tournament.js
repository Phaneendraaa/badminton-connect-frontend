import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography, FontWeight } from "../theme/tokens";

export default function Tournament() {
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
        </View>

        {/* Idle Placeholder */}
        <View style={styles.placeholderContainer}>
          <View style={styles.iconWrap}>
            <Ionicons name="trophy-outline" size={72} color={Colors.textTertiary} />
          </View>
          <Text style={styles.placeholderTitle}>Tournaments are coming soon</Text>
          <Text style={styles.placeholderBody}>
            We're working on regional leagues and prize tournaments. Check back later.
          </Text>
        </View>
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
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 60,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  placeholderTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  placeholderBody: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
