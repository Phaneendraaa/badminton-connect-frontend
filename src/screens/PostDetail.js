import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function PostDetail({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [myRequest, setMyRequest] = useState(null); // the current user's join request for this post
  const [pendingRequests, setPendingRequests] = useState([]); // organizer view
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      // 1. Post detail
      const postRes = await api(`/match-post/${postId}`);
      const postData = await postRes.json().catch(() => ({}));
      if (!postRes.ok) throw new Error(postData.message || "Failed to load post");
      setPost(postData);

      // 2. My join requests — find one for this post
      const myReqRes = await api("/match-join-request/mine");
      if (myReqRes.ok) {
        const myReqs = await myReqRes.json().catch(() => []);
        const found = myReqs.find((r) => r.postId === postId);
        setMyRequest(found || null);
      }

      // 3. If organizer, fetch pending requests for this post
      const currentUserId = user?.userId || user?.id;
      if (postData.organizerId && String(postData.organizerId) === String(currentUserId)) {
        const reqsRes = await api("/match-join-request/for-my-posts");
        if (reqsRes.ok) {
          const allReqs = await reqsRes.json().catch(() => []);
          const forThisPost = allReqs.filter(
            (r) => r.postId === postId && r.status === "PENDING"
          );
          setPendingRequests(forThisPost);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentUserId = user?.userId || user?.id;
  const isOrganizer = post && String(post.organizerId) === String(currentUserId);

  // ── Actions ──

  const handleRequestToJoin = async () => {
    setActionLoading(true);
    try {
      const res = await api(`/match-post/${postId}/request`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit request");
      Alert.alert("Requested!", "Your join request has been submitted.");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;
    Alert.alert("Cancel Request", "Are you sure you want to withdraw your request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await api(`/match-join-request/${myRequest.requestId}/cancel`, {
              method: "PATCH",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Failed to cancel request");
            Alert.alert("Cancelled", "Your join request has been withdrawn.");
            fetchData();
          } catch (err) {
            Alert.alert("Error", err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCancelPost = async () => {
    Alert.alert("Cancel Post", "This will reject all pending requests. Continue?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Post",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await api(`/match-post/${postId}/cancel`, { method: "PATCH" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Failed to cancel post");
            Alert.alert("Post Cancelled", "Your match post has been cancelled.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            Alert.alert("Error", err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api(`/match-join-request/${requestId}/accept`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to accept request");
      Alert.alert("Accepted!", "Player has been added to the match.");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api(`/match-join-request/${requestId}/reject`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to reject request");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render helpers ──

  const renderCTA = () => {
    if (!post) return null;

    // Accepted joiner — go to chat
    if (myRequest?.status === "ACCEPTED") {
      return (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: Colors.success }]}
          onPress={() => navigation.navigate("MatchChat", { matchId: post.matchId })}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.textInverse} />
          <Text style={styles.ctaBtnText}>Go to Match Chat</Text>
        </TouchableOpacity>
      );
    }

    // Pending request
    if (myRequest?.status === "PENDING") {
      return (
        <View style={styles.pendingRow}>
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={styles.pendingText}>Request Pending</Text>
          </View>
          <TouchableOpacity
            style={styles.cancelReqBtn}
            onPress={handleCancelRequest}
            disabled={actionLoading}
          >
            <Text style={styles.cancelReqText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Rejected
    if (myRequest?.status === "REJECTED") {
      return (
        <View style={styles.rejectedBadge}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.rejectedText}>Request Rejected</Text>
        </View>
      );
    }

    // Non-OPEN post
    if (post.status !== "OPEN") {
      return (
        <View style={styles.rejectedBadge}>
          <Text style={styles.rejectedText}>
            {post.status === "FULL" ? "This match is full" : `Post ${post.status.toLowerCase()}`}
          </Text>
        </View>
      );
    }

    // Default CTA: request to join
    if (!isOrganizer) {
      return (
        <TouchableOpacity
          style={[styles.ctaBtn, actionLoading && styles.ctaBtnDisabled]}
          onPress={handleRequestToJoin}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.ctaBtnText}>Request to Join</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  // ── Loading / Error ──

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={60} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to load post</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scheduledDate = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString([], { dateStyle: "full", timeStyle: "short" })
    : "TBD";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Post</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, post.status === "OPEN" ? styles.openBadge : styles.closedBadge]}>
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
          <Text style={styles.postDate}>
            Posted {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Core info card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{post.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{scheduledDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              {post.matchType} · {post.slotsJoined}/{post.slotsTotal} players
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="bar-chart-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              ELO {post.eloMin} – {post.eloMax}
            </Text>
          </View>
        </View>

        {/* Organizer card */}
        <Text style={styles.sectionTitle}>Organizer</Text>
        <View style={styles.card}>
          <View style={styles.playerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(post.organizerName || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.playerName}>{post.organizerName}</Text>
              <Text style={styles.playerElo}>{post.organizerElo} ELO</Text>
            </View>
            {isOrganizer && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>You</Text>
              </View>
            )}
          </View>
        </View>

        {/* Confirmed roster */}
        {post.confirmedRoster && post.confirmedRoster.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Confirmed Players</Text>
            <View style={styles.card}>
              {post.confirmedRoster.map((player, idx) => (
                <View
                  key={player.userId || idx}
                  style={[styles.playerRow, idx > 0 && styles.playerRowDivider]}
                >
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(player.name || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerElo}>{player.eloRating} ELO</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* CTA (requester or "You're in" ) */}
        <View style={styles.ctaSection}>{renderCTA()}</View>

        {/* Organizer: pending requests list */}
        {isOrganizer && pendingRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Join Requests ({pendingRequests.length})</Text>
            {pendingRequests.map((req) => (
              <View key={req.requestId} style={[styles.card, styles.requestCard]}>
                <View style={styles.playerRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(req.userName || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{req.userName}</Text>
                    <Text style={styles.playerElo}>{req.eloAtRequest} ELO</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestBtn, styles.acceptBtn]}
                    onPress={() => handleAcceptRequest(req.requestId)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.requestBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestBtn, styles.rejectBtn]}
                    onPress={() => handleRejectRequest(req.requestId)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.requestBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Organizer: cancel post */}
        {isOrganizer && (post.status === "OPEN" || post.status === "FULL") && (
          <TouchableOpacity
            style={[styles.cancelPostBtn, actionLoading && styles.ctaBtnDisabled]}
            onPress={handleCancelPost}
            disabled={actionLoading}
          >
            <Text style={styles.cancelPostText}>Cancel Post</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  content: { paddingBottom: Spacing.xxl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.lg },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  openBadge: { backgroundColor: Colors.successLight },
  closedBadge: { backgroundColor: Colors.border },
  statusText: { fontSize: Typography.caption, fontWeight: FontWeight.bold, color: Colors.success },
  postDate: { fontSize: Typography.caption, color: Colors.textTertiary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  playerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  playerRowDivider: { paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.md },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  playerName: { fontSize: Typography.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  playerElo: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  youBadge: {
    marginLeft: "auto",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  youText: { fontSize: Typography.caption, fontWeight: FontWeight.bold, color: Colors.primary },

  ctaSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.md },
  ctaBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.md,
  },
  ctaBtnDisabled: { backgroundColor: Colors.disabled },
  ctaBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: Typography.body },

  pendingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  pendingText: { color: Colors.warning, fontWeight: FontWeight.semiBold, fontSize: Typography.bodySmall },
  cancelReqBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.danger },
  cancelReqText: { color: Colors.danger, fontWeight: FontWeight.semiBold, fontSize: Typography.bodySmall },

  rejectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  rejectedText: { color: Colors.danger, fontWeight: FontWeight.semiBold, fontSize: Typography.bodySmall },

  requestCard: { marginBottom: Spacing.sm },
  requestActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  requestBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.sm, alignItems: "center" },
  acceptBtn: { backgroundColor: Colors.success },
  rejectBtn: { backgroundColor: Colors.danger },
  requestBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold },

  cancelPostBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: "center",
  },
  cancelPostText: { color: Colors.danger, fontWeight: FontWeight.bold, fontSize: Typography.body },

  errorTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  errorSub: { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm },
  retryBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  retryText: { color: Colors.textInverse, fontWeight: FontWeight.semiBold },
});
