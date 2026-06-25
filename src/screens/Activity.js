import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function Activity() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "rooms", "invites"
  
  const [posts, setPosts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [invites, setInvites] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch data whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [activeTab])
  );

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === "posts") {
        const response = await api("/match-post/mine");
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } else if (activeTab === "rooms") {
        const response = await api("/match/my-rooms");
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } else {
        const response = await api("/challenge-friend/my-requests");
        if (response.ok) {
          const data = await response.json();
          setInvites(data);
        }
      }
    } catch (error) {
      console.error(error);
      if (!isRefresh) Alert.alert("Error", "Failed to fetch data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptInvite = async (matchId) => {
    try {
      const response = await api(`/challenge-friend/accept-invite/${matchId}`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Invite accepted! You are now in the room.");
        fetchData(); 
      } else {
        Alert.alert("Error", "Failed to accept invite.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error");
    }
  };

  const handleDeclineInvite = async (matchId) => {
    try {
      const response = await api(`/challenge-friend/decline-invite/${matchId}`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Invite declined.");
        fetchData(); 
      } else {
        Alert.alert("Error", "Failed to decline invite.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error");
    }
  };

  // ── Render: My Posts ────────────────────────────────────────────────────────
  const renderPostItem = ({ item }) => {
    const scheduledDate = item.scheduledAt
      ? new Date(item.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "TBD";

    return (
      <TouchableOpacity
        style={styles.cardBorder}
        onPress={() => navigation.navigate("PostDetail", { postId: item.postId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E2640', '#121829']}
          style={styles.cardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{item.title || `Match: ${item.matchType}`}</Text>
            {item.pendingRequestCount > 0 && (
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>{item.pendingRequestCount} New</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>{scheduledDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>Slots filled: {item.slotsJoined} / {item.slotsTotal}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>Status: {item.status}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ── Render: My Rooms ────────────────────────────────────────────────────────
  const renderRoomItem = ({ item }) => {
    const scheduledDate = item.scheduledAt
      ? new Date(item.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "TBD";

    const isChallenge = item.origin === "CHALLENGE";

    return (
      <TouchableOpacity
        style={styles.cardBorder}
        onPress={() => navigation.navigate("Challenge-Room", { matchId: item.matchId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E2640', '#121829']}
          style={styles.cardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
            <View style={[styles.originBadge, isChallenge ? styles.originBadgeChallenge : styles.originBadgeOpen]}>
              <Text style={[styles.originBadgeText, isChallenge ? styles.originChallengeText : styles.originOpenText]}>
                {isChallenge ? "Challenge" : "Open Post"}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>{scheduledDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>Slots filled: {item.slotsJoined} / {item.slotsTotal}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="sync-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>Lobby status: {item.status}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ── Render: Invites ─────────────────────────────────────────────────────────
  const renderInviteItem = ({ item }) => (
    <View style={styles.cardBorder}>
      <LinearGradient
        colors={['#1E2640', '#121829']}
        style={styles.cardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.cardSub}>Invite from {item.organizerName}</Text>
        </View>

        {item.scheduledAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>
              {new Date(item.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => handleAcceptInvite(item.matchId)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.actionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.declineButton]}
            onPress={() => handleDeclineInvite(item.matchId)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: Colors.danger }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // ── Empty States & Content Routing ──────────────────────────────────────────
  const getListContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (activeTab === "posts") {
      return (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          renderItem={renderPostItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>You haven't posted any matches yet.</Text>
              <TouchableOpacity style={styles.emptyCtaBtn} onPress={() => navigation.navigate("CreatePost")}>
                <Text style={styles.emptyCtaText}>Create a post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    if (activeTab === "rooms") {
      return (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>You are not in any active rooms.</Text>
              <Text style={styles.emptySubtext}>Challenge a friend or join an open post.</Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={invites}
        keyExtractor={(item) => item.matchId.toString()}
        renderItem={renderInviteItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No pending friend invites.</Text>
          </View>
        }
      />
    );
  };

  const getInstructionText = () => {
    if (activeTab === "posts") {
      return "Approve or decline join requests here. Once your post fills up, start the match from the My Rooms tab.";
    }
    if (activeTab === "rooms") {
      return "These are matches you're confirmed in, from both friend challenges and open posts. Tap one to open its room and start play.";
    }
    return "Pending challenges from your friends. Accept them to join the match room.";
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "posts" && styles.activeTabText]}>My Posts</Text>
          {activeTab === "posts" && <LinearGradient colors={Colors.accentGreen} style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "rooms" && styles.activeTab]}
          onPress={() => setActiveTab("rooms")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "rooms" && styles.activeTabText]}>My Rooms</Text>
          {activeTab === "rooms" && <LinearGradient colors={Colors.accentGreen} style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "invites" && styles.activeTab]}
          onPress={() => setActiveTab("invites")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "invites" && styles.activeTabText]}>Invites</Text>
          {activeTab === "invites" && <LinearGradient colors={Colors.accentGreen} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Instruction Banner */}
      <View style={styles.statsStripBorder}>
        <LinearGradient
          colors={['rgba(0, 245, 160, 0.12)', 'rgba(0, 217, 245, 0.04)']}
          style={styles.statsStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.statsText}>{getInstructionText()}</Text>
        </LinearGradient>
      </View>

      {/* List Content */}
      <View style={{ flex: 1 }}>
        {getListContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    position: "relative",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  tabText: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },

  // Instruction Banner
  statsStripBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  statsText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },

  // Lists
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Cards
  cardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  cardInner: {
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  originBadgeOpen: {
    backgroundColor: "rgba(0, 245, 160, 0.12)",
    borderColor: "rgba(0, 245, 160, 0.2)",
  },
  originBadgeChallenge: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  originBadgeText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  originOpenText: {
    color: Colors.primary,
  },
  originChallengeText: {
    color: "#8B5CF6",
  },
  badgeWrap: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  cardSub: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionBtnWrapper: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: "center",
  },
  emptyCtaBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
  },
  emptyCtaText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },
});
