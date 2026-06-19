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

        const newItems = (data.content || []).filter(Boolean); // null items filtered (already-joined posts)
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

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("PostDetail", { postId: item.postId })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, item.matchType === "SINGLES" ? styles.singlesBadge : styles.doublesBadge]}>
            <Text style={styles.typeBadgeText}>{item.matchType}</Text>
          </View>
          <Text style={styles.eloRange}>
            {item.eloMin} – {item.eloMax} ELO
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location || "Unknown location"}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{scheduledDate}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.organizerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(item.organizerName || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.organizerName}>{item.organizerName || "Unknown"}</Text>
              <Text style={styles.organizerElo}>{item.organizerElo} ELO</Text>
            </View>
          </View>

          <View style={styles.slotsChip}>
            <Text style={styles.slotsText}>
              {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={60} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No open matches found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your filters or check back later</Text>
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
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Matches</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreatePost")}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, matchTypeFilter === "SINGLES" && styles.filterChipActive]}
          onPress={() => setFilter("SINGLES")}
        >
          <Text style={[styles.filterChipText, matchTypeFilter === "SINGLES" && styles.filterChipTextActive]}>
            Singles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, matchTypeFilter === "DOUBLES" && styles.filterChipActive]}
          onPress={() => setFilter("DOUBLES")}
        >
          <Text style={[styles.filterChipText, matchTypeFilter === "DOUBLES" && styles.filterChipTextActive]}>
            Doubles
          </Text>
        </TouchableOpacity>

        <View style={styles.locationInput}>
          <Ionicons name="search-outline" size={14} color={Colors.textTertiary} />
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

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding open matches…</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

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
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filter bar
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterChipTextActive: { color: Colors.textInverse },
  locationInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 4,
  },
  locationInputText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
  },

  // List
  list: { padding: Spacing.lg, gap: Spacing.sm },
  listEmpty: { flex: 1 },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
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
  singlesBadge: { backgroundColor: Colors.primaryLight },
  doublesBadge: { backgroundColor: "#F3E8FF" },
  typeBadgeText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  eloRange: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.md,
  },
  dateText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  organizerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  organizerName: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  organizerElo: { fontSize: Typography.caption, color: Colors.textSecondary },
  slotsChip: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  slotsText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.success,
  },

  // Empty / Error
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
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
  retryText: { color: Colors.textInverse, fontWeight: FontWeight.semiBold },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.body },
});
