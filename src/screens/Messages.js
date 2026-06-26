import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function relativeTime(dateStr) {
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

export default function Messages({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [])
  );

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const response = await api("/match-chat/threads");
      if (response.ok) {
        const data = await response.json();
        setThreads(data || []);
      }
    } catch (error) {
      console.error("Failed to load message threads", error);
    } finally {
      setLoading(false);
    }
  };

  const renderThread = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const otherNames = item.participantNames?.slice(0, 2).join(", ") || "Match chat";
    const scheduledDate = formatDate(item.scheduledAt);

    return (
      <TouchableOpacity
        style={[styles.threadBorder, hasUnread && styles.threadUnread]}
        onPress={() => navigation.navigate("MatchChat", { matchId: item.matchId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={hasUnread ? ["#1E2640", "#121829"] : [Colors.surface, Colors.surface]}
          style={styles.threadInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Avatar / Type Icon */}
          <LinearGradient
            colors={item.matchType === "SINGLES" ? Colors.accentGreen : Colors.accentPurple}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={item.matchType === "SINGLES" ? "person" : "people"}
              size={20}
              color={Colors.textInverse}
            />
          </LinearGradient>

          {/* Content */}
          <View style={styles.threadContent}>
            {/* Match name + time */}
            <View style={styles.threadTopRow}>
              <Text style={[styles.matchName, hasUnread && styles.matchNameBold]} numberOfLines={1}>
                {item.matchName || "Match chat"}
              </Text>
              {item.lastMessageAt && (
                <Text style={styles.threadTime}>{relativeTime(item.lastMessageAt)}</Text>
              )}
            </View>

            {/* Participants */}
            {otherNames ? (
              <Text style={styles.participants} numberOfLines={1}>
                with {otherNames}
              </Text>
            ) : null}

            {/* Last message preview OR scheduled date */}
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageBold]}
              numberOfLines={1}
            >
              {item.lastMessage
                ? item.lastMessage
                : scheduledDate
                ? `Scheduled: ${scheduledDate}`
                : "No messages yet"}
            </Text>
          </View>

          {/* Unread badge */}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
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
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.matchId}
            renderItem={renderThread}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={80} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Messages from your matches will appear here.
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
  threadBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  threadUnread: {
    borderColor: "rgba(0, 245, 160, 0.25)",
  },
  threadInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  threadContent: {
    flex: 1,
    minWidth: 0,
  },
  threadTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  matchName: {
    fontSize: Typography.body,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  matchNameBold: {
    fontWeight: FontWeight.bold,
  },
  threadTime: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    flexShrink: 0,
  },
  participants: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  lastMessageBold: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
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
