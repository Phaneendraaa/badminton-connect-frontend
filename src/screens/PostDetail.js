import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function PostDetail({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [myRequest, setMyRequest] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId || user?.id;

  React.useEffect(() => {
    console.log("[PostDetail] Mounted. resolved currentUserId:", currentUserId, "user context object:", user);
  }, [currentUserId, user]);

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
      if (postData.organizerId && String(postData.organizerId) === String(currentUserId)) {
        const reqsRes = await api("/match-join-request/for-my-posts");
        if (reqsRes.ok) {
          const allReqs = await reqsRes.json().catch(() => []);
          const forThisPost = allReqs.filter(
            (r) => String(r.postId).toLowerCase() === String(postId).toLowerCase() && r.status === "PENDING"
          );
          setPendingRequests(forThisPost);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [postId, user, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const isOrganizer = post && String(post.organizerId) === String(currentUserId);

  // ── Actions ──

  const handleRequestToJoin = async () => {
    setActionLoading(true);
    try {
      const res = await api(`/match-post/${postId}/request`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit request");
      Alert.alert("Requested!", "Your join request has been submitted. 🚀");
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
    Alert.alert("Cancel Post", "This will reject all pending requests and delete this match. Continue?", [
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
      Alert.alert("Accepted!", "Player has been added to the match. 🎉");
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

    // ── Accepted joiner — go to chat
    if (myRequest?.status === "ACCEPTED") {
      return (
        <>
          <TouchableOpacity
            style={styles.ctaBtnWrapper}
            onPress={() => navigation.navigate("MatchChat", { matchId: post.matchId })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.accentPurple}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <Text style={[styles.ctaBtnText, { color: '#FFFFFF' }]}>Go to Match Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaBtnWrapper, { marginTop: Spacing.sm }]}
            onPress={() => navigation.navigate("PostInquiry", { postId, postTitle: post.title })}
            activeOpacity={0.85}
          >
            <View style={styles.inquiryBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.inquiryBtnText}>Open Post Inquiries</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }

    // ── Pending request
    if (myRequest?.status === "PENDING") {
      return (
        <>
          <View style={styles.pendingRow}>
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={16} color={Colors.warning} style={{ marginRight: 6 }} />
              <Text style={styles.pendingText}>Request Pending</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelReqBtn}
              onPress={handleCancelRequest}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelReqText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.ctaBtnWrapper, { marginTop: Spacing.md }]}
            onPress={() => navigation.navigate("PostInquiry", { postId, postTitle: post.title })}
            activeOpacity={0.85}
          >
            <View style={styles.inquiryBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.inquiryBtnText}>Ask the Organizer</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }

    // ── Rejected
    if (myRequest?.status === "REJECTED") {
      return (
        <View style={styles.rejectedBadge}>
          <Ionicons name="close-circle" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.rejectedText}>Request Rejected</Text>
        </View>
      );
    }

    // ── Post full, non-organizer
    if (post.status === "FULL" && !isOrganizer) {
      return (
        <View style={styles.rejectedBadge}>
          <Ionicons name="lock-closed" size={18} color={Colors.textTertiary} style={{ marginRight: 6 }} />
          <Text style={[styles.rejectedText, { color: Colors.textSecondary }]}>This match is full</Text>
        </View>
      );
    }

    // ── Non-OPEN, non-FULL post
    if (post.status !== "OPEN" && post.status !== "FULL") {
      return (
        <View style={styles.rejectedBadge}>
          <Ionicons name="lock-closed" size={18} color={Colors.textTertiary} style={{ marginRight: 6 }} />
          <Text style={[styles.rejectedText, { color: Colors.textSecondary }]}>Post is {post.status}</Text>
        </View>
      );
    }

    // ── Organizer: post FULL → team formation
    if (isOrganizer && post.status === "FULL") {
      return (
        <TouchableOpacity
          style={styles.ctaBtnWrapper}
          onPress={() => navigation.navigate("TeamFormation", { matchId: post.matchId })}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.accentGreen}
            style={styles.ctaBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="people" size={20} color={Colors.textInverse} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.ctaBtnText}>Set Up Teams & Start Match</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // ── Default CTA: request to join (OPEN post, not organizer)
    if (!isOrganizer) {
      return (
        <>
          <TouchableOpacity
            style={styles.ctaBtnWrapper}
            onPress={handleRequestToJoin}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {actionLoading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color={Colors.textInverse} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.ctaBtnText}>Request to Join Match</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaBtnWrapper, { marginTop: Spacing.sm }]}
            onPress={() => navigation.navigate("PostInquiry", { postId, postTitle: post.title })}
            activeOpacity={0.85}
          >
            <View style={styles.inquiryBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.inquiryBtnText}>Ask the Organizer</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={60} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to load post</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scheduledDate = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString([], { dateStyle: "full", timeStyle: "short" })
    : "TBD";

  const isSingles = post.matchType === "SINGLES";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Page Instruction */}
      <View style={styles.statsStripBorder}>
        <LinearGradient
          colors={['rgba(0, 245, 160, 0.12)', 'rgba(0, 217, 245, 0.04)']}
          style={styles.statsStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="flash-outline" size={16} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.statsText}>Review this match and request to join, or manage requests if it's your post.</Text>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              post.status === "OPEN" ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={[styles.statusText, post.status !== "OPEN" && { color: Colors.textSecondary }]}>
              {post.status}
            </Text>
          </View>
          <Text style={styles.postDate}>
            Posted {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Core info card */}
        <View style={styles.cardBorder}>
          <LinearGradient
            colors={['#1E2640', '#121829']}
            style={styles.cardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.postTitle}>{post.title}</Text>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                {post.location ? (
                  <TouchableOpacity onPress={() => Linking.openURL(post.location)} style={styles.mapsBtn} activeOpacity={0.8}>
                    <LinearGradient
                      colors={Colors.accentGreen}
                      style={styles.mapsGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="map" size={14} color={Colors.textInverse} style={{ marginRight: 6 }} />
                      <Text style={styles.mapsText}>Open in Google Maps</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoTextMuted}>Location not shared yet</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>DATE & TIME</Text>
                <Text style={styles.infoText}>{scheduledDate}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="people-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>MATCH TYPE & SLOTS</Text>
                <Text style={styles.infoText}>
                  {post.matchType} · {post.slotsJoined}/{post.slotsTotal} players filled
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>TARGET SKILL LEVEL</Text>
                <Text style={styles.infoText}>
                  {post.eloMin} – {post.eloMax} ELO Rating
                </Text>
              </View>
            </View>

            {post.description ? (
              <View style={styles.descriptionContainer}>
                <Text style={styles.infoLabel}>ORGANIZER NOTES</Text>
                <Text style={styles.descriptionText}>{post.description}</Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {/* Organizer card */}
        <Text style={styles.sectionTitle}>Organizer</Text>
        <View style={styles.playerCardBorder}>
          <TouchableOpacity 
            style={styles.playerCardInner} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate("PublicProfile", { userId: post.organizerId })}
          >
            <LinearGradient
              colors={isSingles ? Colors.accentGreen : Colors.accentPurple}
              style={styles.avatarWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>
                {(post.organizerName || "?")[0].toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{post.organizerName}</Text>
              <Text style={styles.playerElo}>{post.organizerElo} ELO Rating</Text>
            </View>
            {isOrganizer && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>Host</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Confirmed roster */}
        {post.confirmedRoster && post.confirmedRoster.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Confirmed Roster</Text>
            <View style={styles.cardBorder}>
              <View style={[styles.cardInner, { padding: 0 }]}>
                {post.confirmedRoster.map((player, idx) => (
                  <View
                    key={player.userId || idx}
                    style={[
                      styles.playerCardInner,
                      idx > 0 && styles.playerRowDivider,
                    ]}
                  >
                    <LinearGradient
                      colors={isSingles ? Colors.accentGreen : Colors.accentPurple}
                      style={[styles.avatarWrap, { width: 38, height: 38 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.avatarInitial, { fontSize: Typography.body }]}>
                        {(player.name || "?")[0].toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerElo}>{player.eloRating} ELO Rating</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* CTA Section */}
        <View style={styles.ctaSection}>{renderCTA()}</View>

        {/* Organizer: pending requests list */}
        {isOrganizer && pendingRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Join Requests ({pendingRequests.length})</Text>
            {pendingRequests.map((req) => (
              <View key={req.requestId} style={styles.requestCardBorder}>
                <View style={styles.requestCardInner}>
                  <View style={styles.playerCardInner}>
                    <LinearGradient
                      colors={Colors.accentGreen}
                      style={[styles.avatarWrap, { width: 38, height: 38 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.avatarInitial, { fontSize: Typography.body }]}>
                        {(req.userName || "?")[0].toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{req.userName}</Text>
                      <Text style={styles.playerElo}>{req.eloAtRequest} ELO</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.requestBtnWrapper}
                      onPress={() => handleAcceptRequest(req.requestId)}
                      disabled={actionLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.requestBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.requestBtnText}>Accept</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestBtn, styles.rejectBtn]}
                      onPress={() => handleRejectRequest(req.requestId)}
                      disabled={actionLoading}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.requestBtnText, { color: Colors.danger }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Organizer: inquiries thread button */}
        {isOrganizer && (
          <TouchableOpacity
            style={[styles.inquiryBtn, { marginHorizontal: Spacing.lg, marginTop: Spacing.sm }]}
            onPress={() => navigation.navigate("PostInquiry", { postId, postTitle: post.title })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.inquiryBtnText}>View Inquiries</Text>
          </TouchableOpacity>
        )}

        {/* Organizer: cancel post */}
        {isOrganizer && (post.status === "OPEN" || post.status === "FULL") && (
          <TouchableOpacity
            style={[styles.cancelPostBtn, actionLoading && styles.ctaBtnDisabled]}
            onPress={handleCancelPost}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelPostText}>Cancel Match Post</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  content: {
    paddingBottom: Spacing.xxl + 40,
  },

  // Header
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
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

  // Page Instruction
  statsStripBorder: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomColor: Colors.border,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  statsText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
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
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  openBadge: {
    backgroundColor: "rgba(0, 245, 160, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.25)",
  },
  closedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  postDate: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },

  // Cards
  cardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  cardInner: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  postTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(0, 245, 160, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
  infoTextMuted: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
  },
  mapsBtn: {
    borderRadius: Radius.sm,
    overflow: "hidden",
    marginTop: 4,
    alignSelf: "flex-start",
  },
  mapsGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  mapsText: {
    color: Colors.textInverse,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  descriptionContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descriptionText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 4,
  },

  // Player cards
  playerCardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  playerCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  playerRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  avatarInitial: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  playerName: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  playerElo: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  youText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: "#8B5CF6",
  },

  // CTA Section
  ctaSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  ctaBtnWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
    ...Shadow.md,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
  },
  ctaBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },

  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  pendingText: {
    color: Colors.warning,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },
  cancelReqBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cancelReqText: {
    color: Colors.danger,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },

  rejectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  rejectedText: {
    color: Colors.danger,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },

  // Request cards (organizer view)
  requestCardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  requestCardInner: {
    padding: Spacing.sm,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  requestBtnWrapper: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  requestBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  requestBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },

  cancelPostBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cancelPostText: {
    color: Colors.danger,
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },

  // Inquiry button
  inquiryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 217, 245, 0.25)",
    backgroundColor: "rgba(0, 217, 245, 0.06)",
  },
  inquiryBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },

  errorTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  errorSub: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  retryText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
});
