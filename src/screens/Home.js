import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";
import { useNavigation } from "@react-navigation/native";
import CitySearchPicker from "../components/CitySearchPicker";

const PAGE_SIZE = 20;

export default function Home() {
  const navigation = useNavigation();
  const { user, isNewUser, unreadCount } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [messageUnread, setMessageUnread] = useState(0);

  // Filters
  const [matchTypeFilter, setMatchTypeFilter] = useState(null); // null | 'SINGLES' | 'DOUBLES'
  // Default cityFilter to the user's home city (if set) so the feed is personalised on first load.
  const [cityFilter, setCityFilter] = useState(user?.homeCity || "");

  // Reference data
  const [cities, setCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Fetch badge counts on mount
  useEffect(() => {
    fetchBadgeCounts();
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      // Notification unread count comes from AuthContext (updated live via STOMP).
      // Only fetch the message thread unread count here.
      const threadsRes = await api("/match-chat/threads");
      if (threadsRes.ok) {
        const threads = await threadsRes.json();
        const total = (threads || []).reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        setMessageUnread(total);
      }
    } catch (e) {
      // Non-critical
    }
  };

  // Sync homeCity from profile if not already set in filter
  useEffect(() => {
    if (!cityFilter && user?.homeCity) {
      setCityFilter(user.homeCity);
    }
  }, [user?.homeCity]);

  useEffect(() => {
    if (isNewUser) {
      navigation.navigate("Profile-create");
    }
  }, [isNewUser]);

  // Load cities once
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await api("/reference/cities");
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        }
      } catch (err) {
        console.error("Failed to load cities", err);
      }
    };
    loadCities();
  }, []);

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
        if (cityFilter) params.append("city", cityFilter);

        const response = await api(`/match-post/feed?${params}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to load open matches");
        }

        const newItems = (data.content || []).filter(Boolean);
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
    [matchTypeFilter, cityFilter]
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

          {/* Location details */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text
              style={[styles.infoText, (!item.city && !item.location) && { color: Colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.city === "Other" && item.cityOther 
                ? item.cityOther 
                : item.city ? item.city : "City not specified"}
              {item.location ? ` • ${item.location}` : ""}
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
              {item.organizerAvatarUrl ? (
                <Image source={{ uri: item.organizerAvatarUrl }} style={styles.avatarWrap} />
              ) : (
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
              )}
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
        <Text style={styles.emptySubtitle}>Try adjusting your filters to find games near you</Text>
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

  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "there";

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
          <View>
            <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Ready to play?</Text>
          </View>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityLabel="Search Players"
              onPress={() => navigation.navigate("SearchPlayers")}
            >
              <Ionicons name="search" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityLabel="Messages"
              onPress={() => {
                fetchBadgeCounts();
                navigation.navigate("Messages");
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.textPrimary} />
              {messageUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {messageUnread > 9 ? "9+" : messageUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityLabel="Notifications"
              onPress={() => {
                fetchBadgeCounts();
                navigation.navigate("Notifications");
              }}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
              {notifUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter bar */}
        <View style={styles.filterBar}>
          {/* Match Type Filters */}
          <View style={styles.typeFilters}>
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
          </View>
          
          {/* City Filter */}
          <TouchableOpacity
            style={styles.cityFilterBtn}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={16} color={cityFilter ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.cityFilterText, cityFilter && styles.cityFilterTextActive]} numberOfLines={1}>
              {cityFilter || "All Cities"}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* CitySearchPicker Modal */}
        <CitySearchPicker
          visible={showCityPicker}
          cities={cities}
          selectedCity={cityFilter || null}
          onSelect={(city) => {
            setCityFilter(city || "");
            setShowCityPicker(false);
          }}
          onClose={() => setShowCityPicker(false)}
          allowAll
        />

        {/* Content List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading open matches…</Text>
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
            showsVerticalScrollIndicator={false}
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

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: Typography.h1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // Filter bar
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  typeFilters: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  
  // City Filter
  cityFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 140,
    gap: 4,
  },
  cityFilterText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flexShrink: 1,
  },
  cityFilterTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  
  // City Picker (Dropdown)
  cityPickerContainer: {
    position: "absolute",
    top: 135,
    right: Spacing.lg,
    width: 180,
    maxHeight: 250,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
    zIndex: 100,
    elevation: 10, // for Android
  },
  cityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cityOptionText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  cityOptionActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
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
});
