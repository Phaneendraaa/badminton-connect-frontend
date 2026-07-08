import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

/**
 * SearchPlayers screen
 * Case-insensitive search across all player profiles.
 * Tapping a result navigates to PublicProfile.
 * Accessible from the Profile tab header button.
 */
export default function SearchPlayers({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounce timer ref
  const debounceRef = useRef(null);

  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api(`/profile/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data || []);
      }
    } catch (e) {
      console.error("SearchPlayers error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(text), 400);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate("PublicProfile", { userId: item.id })}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={["#1E2640", "#121829"]}
        style={styles.cardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {item.profilePictureUrl ? (
            <Image source={{ uri: item.profilePictureUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={Colors.accentGreen} style={styles.avatarPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>
                {(item.firstName || "?")[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.playerName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.tagRow}>
            {item.homeCity && (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={12} color={Colors.primary} style={{ marginRight: 3 }} />
                <Text style={styles.tagText}>{item.homeCity}</Text>
              </View>
            )}
            {item.genderEnum && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.genderEnum}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Players</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChangeText}
            placeholder="Search by name…"
            placeholderTextColor={Colors.textTertiary}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {query.trim().length > 0 && query.trim().length < 2 && (
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        )}
      </View>

      {/* Results / States */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <LinearGradient colors={Colors.accentPurple} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="people" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Find Your Rivals 🏸</Text>
          <Text style={styles.emptySubtext}>Search for players by first or last name</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No players found</Text>
          <Text style={styles.emptySubtext}>Try a different name</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} player{results.length !== 1 ? "s" : ""} found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  searchBarWrap: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(9,13,26,0.8)", borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 50,
  },
  searchInput: { flex: 1, fontSize: Typography.body, color: Colors.textPrimary },
  hintText: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: Spacing.xs },

  list: { padding: Spacing.lg, paddingBottom: 40 },
  resultsCount: {
    fontSize: Typography.caption, color: Colors.textTertiary,
    marginBottom: Spacing.md, fontWeight: FontWeight.medium,
  },

  resultCard: {
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden", marginBottom: Spacing.sm, ...Shadow.md,
  },
  cardInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: Spacing.md },

  avatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", borderRadius: 24 },
  avatarPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: Typography.h4 },

  infoCol: { flex: 1 },
  playerName: { fontSize: Typography.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  tagRow: { flexDirection: "row", gap: Spacing.xs },
  tag: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0, 217, 245, 0.08)", borderWidth: 1, borderColor: "rgba(0, 217, 245, 0.15)",
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: Typography.caption, color: Colors.textSecondary },

  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md, textAlign: "center" },
  emptySubtext: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm },
});
