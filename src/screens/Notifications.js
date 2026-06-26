import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const NOTIFICATION_ICONS = {
  JOIN_REQUEST_RECEIVED: { name: "person-add-outline", color: "#8B5CF6" },
  JOIN_REQUEST_ACCEPTED: { name: "checkmark-circle-outline", color: Colors.primary },
  JOIN_REQUEST_REJECTED: { name: "close-circle-outline", color: Colors.danger },
  POST_FULL:             { name: "people-outline", color: Colors.primary },
  POST_CANCELLED:        { name: "ban-outline", color: Colors.danger },
  MATCH_STARTING_SOON:   { name: "alarm-outline", color: "#F59E0B" },
  NEW_CHAT_MESSAGE:      { name: "chatbubble-ellipses-outline", color: "#00D9F5" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Notifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api("/notifications?page=0&size=50");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.content || []);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notifId) => {
    setMarkingId(notifId);
    try {
      await api(`/notifications/${notifId}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification read", error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleTap = (item) => {
    // Mark read first
    if (!item.read) markRead(item.id);

    // Deep-link based on type
    if (item.type === "NEW_CHAT_MESSAGE" && item.relatedMatchId) {
      navigation.navigate("MatchChat", { matchId: item.relatedMatchId });
      return;
    }

    if (
      (item.type === "JOIN_REQUEST_RECEIVED" ||
        item.type === "POST_FULL" ||
        item.type === "POST_CANCELLED" ||
        item.type === "MATCH_STARTING_SOON") &&
      item.relatedPostId
    ) {
      navigation.navigate("PostDetail", { postId: item.relatedPostId });
      return;
    }

    if (
      (item.type === "JOIN_REQUEST_ACCEPTED" || item.type === "JOIN_REQUEST_REJECTED") &&
      item.relatedPostId
    ) {
      navigation.navigate("PostDetail", { postId: item.relatedPostId });
      return;
    }

    // Stale notification — the related post/match no longer exists
    Alert.alert(
      "Match no longer available",
      "This match has been cancelled or removed.",
      [{ text: "OK" }]
    );
  };

  const renderItem = ({ item }) => {
    const icon = NOTIFICATION_ICONS[item.type] || { name: "notifications-outline", color: Colors.textSecondary };
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[styles.itemBorder, isUnread && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isUnread ? ["#1E2640", "#121829"] : [Colors.surface, Colors.surface]}
          style={styles.itemInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.iconCircle, { borderColor: icon.color + "40" }]}>
            <Ionicons name={icon.name} size={22} color={icon.color} />
          </View>

          <View style={styles.itemContent}>
            <Text style={[styles.itemMessage, isUnread && styles.itemMessageBold]}>
              {item.message}
            </Text>
            <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
          </View>

          {isUnread && (
            markingId === item.id
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <View style={styles.unreadDot} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[Colors.background, "#111827"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={80} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  When someone requests to join your match, or accepts your challenge, you'll be notified here.
                </Text>
              </View>
            }
          />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  itemBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  itemUnread: {
    borderColor: "rgba(0, 245, 160, 0.2)",
  },
  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemMessage: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  itemMessageBold: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  itemTime: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
