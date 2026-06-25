import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

/**
 * Bottom-sheet choice modal for the "+" tab button.
 * Shows two options: Post an Open Match or Challenge a Friend.
 * Slides up from the bottom with a semi-transparent backdrop.
 */
export default function ChoiceSheet({ visible, onClose, onPostOpen, onChallengeFriend }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>What do you want to do?</Text>
          <Text style={styles.subtitle}>Choose how to set up your next match</Text>

          {/* Option 1: Post an Open Match */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={onPostOpen}
            activeOpacity={0.85}
            accessibilityLabel="Post an Open Match"
          >
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.optionIconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="megaphone-outline" size={26} color={Colors.textInverse} />
            </LinearGradient>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Post an Open Match</Text>
              <Text style={styles.optionSubtitle}>Let any eligible player request to join</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          {/* Option 2: Challenge a Friend */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={onChallengeFriend}
            activeOpacity={0.85}
            accessibilityLabel="Challenge a Friend"
          >
            <LinearGradient
              colors={Colors.accentPurple}
              style={styles.optionIconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people-outline" size={26} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Challenge a Friend</Text>
              <Text style={styles.optionSubtitle}>Invite a specific player directly by phone</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl + 4,
    borderTopRightRadius: Radius.xl + 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cancelBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelText: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semiBold,
  },
});
