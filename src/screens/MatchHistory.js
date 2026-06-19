import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function MatchHistory({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api("/challenge-friend/history", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        Alert.alert("Error", "Failed to fetch match history.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error while fetching history.");
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const isPlaying = item.status === 'PLAYING';
    const isDraw = !item.winnerTeam && !isPlaying;
    
    return (
      <View style={styles.cardBorder}>
        <LinearGradient
          colors={['#1E2640', '#121829']}
          style={styles.cardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.matchName || `Match: ${item.matchType}`}</Text>
            <View style={[
              styles.badge, 
              isPlaying ? styles.liveBadge : (isDraw ? styles.drawBadge : styles.winnerBadge)
            ]}>
              <Text style={styles.badgeText}>
                {isPlaying ? "Live" : (isDraw ? "Draw" : `Winner: ${item.winnerTeam === 'TEAM_A' ? 'A' : 'B'}`)}
              </Text>
            </View>
          </View>

          {item.playedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.dateText}>
                {new Date(item.playedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            </View>
          )}

          <View style={styles.scoreRow}>
            <Ionicons name="flash-outline" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.scoreLabel}>{isPlaying ? "Current Sets:" : "Final Sets:"}</Text>
            <Text style={styles.scoreText}>
              {item.teamASetWins} <Text style={{ color: Colors.border }}>-</Text> {item.teamBSetWins}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.detailsBtnWrapper}
            onPress={() => navigation.navigate("MatchPlay", { matchId: item.matchId })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.accentPurple}
              style={styles.detailsButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>View Full Scoreboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Matches</Text>
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
          <Text style={styles.statsText}>See your past matches and results.</Text>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={60} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>You haven't played any matches yet.</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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

  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Card Border wrap
  cardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  cardInner: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  liveBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  winnerBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  drawBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  badgeText: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dateText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.4)",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  scoreText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  
  detailsBtnWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  detailsButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: "center",
  },
});
