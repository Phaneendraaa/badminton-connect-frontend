import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const PAGE_SIZE = 20;

export default function MatchFeed({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [matchTypeFilter, setMatchTypeFilter] = useState(null); // null | 'SINGLES' | 'DOUBLES'
  const [locationFilter, setLocationFilter] = useState("");

  const fetchPosts = useCallback(
    async (pageNum = 0, append = false) => {
      if (!append) setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          size: PAGE_SIZE.toString(),
        });
        if (matchTypeFilter) params.append("matchType", matchTypeFilter);
        if (locationFilter.trim()) params.append("location", locationFilter.trim());

        const response = await api(`/match-post/feed?${params}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to load posts");
        }

        const newItems = (data.content || []).filter(Boolean); // null items filtered
        if (append) {
          setPosts((prev) => [...prev, ...newItems]);
        } else {
          setPosts(newItems);
        }

        setHasMore(!data.last);
        setPage(pageNum);
      } catch (err) {
        setError(err.message || "Something went wrong");
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [matchTypeFilter, locationFilter]
  );

  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(0, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchPosts(page + 1, true);
  };

  const setFilter = (type) => {
    setMatchTypeFilter((prev) => (prev === type ? null : type));
  };

  const renderPost = ({ item }) => {
    if (!item) return null;
    const slotsLeft = item.slotsTotal - item.slotsJoined;
    const scheduledDate = item.scheduledAt
      ? new Date(item.scheduledAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "TBD";

    const isSingles = item.matchType === "SINGLES";

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
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.typeBadge,
                isSingles ? styles.singlesBadge : styles.doublesBadge,
              ]}
            >
              <Text style={[styles.typeBadgeText, isSingles ? styles.singlesText : styles.doublesText]}>
                {item.matchType}
              </Text>
            </View>
            <Text style={styles.eloRange}>
              🏆 {item.eloMin} – {item.eloMax} ELO
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.titleText} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.infoText,
                !item.location && { color: Colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              {item.location ? item.location : "Location not shared yet"}
            </Text>
          </View>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.infoText}>{scheduledDate}</Text>
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.organizerRow}>
              <LinearGradient
                colors={isSingles ? Colors.accentGreen : Colors.accentPurple}
                style={styles.avatarWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarInitial}>
                  {(item.organizerName || "?")[0].toUpperCase()}
                </Text>
              </LinearGradient>
              <View>
                <Text style={styles.organizerName}>{item.organizerName || "Unknown"}</Text>
                <Text style={styles.organizerElo}>{item.organizerElo} ELO</Text>
              </View>
            </View>

            <View style={[styles.slotsChip, slotsLeft === 0 ? styles.slotsFull : styles.slotsAvailable]}>
              <Text style={[styles.slotsText, slotsLeft === 0 ? styles.slotsTextFull : styles.slotsTextAvailable]}>
                {slotsLeft === 0 ? "Full" : `${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} left`}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={60} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No open matches found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your filters or search query</Text>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cloud-offline-outline" size={60} color={Colors.danger} />
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPosts(0, false)}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Matches</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreatePost")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Colors.accentGreen}
            style={styles.createBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={22} color={Colors.textInverse} />
          </LinearGradient>
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
          <Ionicons name="flash-outline" size={16} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.statsText}>Browse open matches near you and request to join one.</Text>
        </LinearGradient>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, matchTypeFilter === "SINGLES" && styles.filterChipActive]}
          onPress={() => setFilter("SINGLES")}
          activeOpacity={0.8}
        >
          {matchTypeFilter === "SINGLES" ? (
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.chipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.filterChipText, { color: Colors.textInverse }]}>Singles</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.filterChipText}>Singles</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, matchTypeFilter === "DOUBLES" && styles.filterChipActive]}
          onPress={() => setFilter("DOUBLES")}
          activeOpacity={0.8}
        >
          {matchTypeFilter === "DOUBLES" ? (
            <LinearGradient
              colors={Colors.accentPurple}
              style={styles.chipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.filterChipText, { color: '#FFFFFF' }]}>Doubles</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.filterChipText}>Doubles</Text>
          )}
        </TouchableOpacity>

        <View style={styles.locationInput}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.locationInputText}
            placeholder="Filter by location..."
            placeholderTextColor={Colors.textTertiary}
            value={locationFilter}
            onChangeText={setLocationFilter}
            onSubmitEditing={() => fetchPosts(0, false)}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Content List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding open matches…</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={posts}
            keyExtractor={(item, idx) => (item?.postId ? item.postId.toString() : idx.toString())}
            renderItem={renderPost}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[styles.list, posts.length === 0 && styles.listEmpty]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
              ) : null
            }
          />

          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("CreatePost")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={28} color={Colors.textInverse} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  createBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

  // Filter bar
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
  },
  filterChipActive: {
    borderWidth: 0,
  },
  chipGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipText: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  locationInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationInputText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    marginLeft: 6,
  },

  // List
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.sm,
  },
  listEmpty: {
    flex: 1,
  },

  // Card Border wrap
  cardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  cardInner: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  singlesBadge: {
    backgroundColor: "rgba(0, 245, 160, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.2)",
  },
  doublesBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  typeBadgeText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  singlesText: {
    color: Colors.primary,
  },
  doublesText: {
    color: "#8B5CF6",
  },
  eloRange: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semiBold,
  },
  titleText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  avatarInitial: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  organizerName: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  organizerElo: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
  slotsChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  slotsAvailable: {
    backgroundColor: Colors.successLight,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  slotsFull: {
    backgroundColor: Colors.dangerLight,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  slotsText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  slotsTextAvailable: {
    color: Colors.success,
  },
  slotsTextFull: {
    color: Colors.danger,
  },

  // Empty / Error
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.body,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.glow,
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
