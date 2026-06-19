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
import api from "../utils/api";

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
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
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
          <Text style={styles.dateText}>
            📅 {new Date(item.playedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        )}

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>{isPlaying ? "Current Sets:" : "Final Sets:"}</Text>
          <Text style={styles.scoreText}>
            {item.teamASetWins} <Text style={{color: '#9ca3af'}}>-</Text> {item.teamBSetWins}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate("MatchPlay", { matchId: item.matchId })}
        >
          <Text style={styles.buttonText}>View Full Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>My Matches</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderHistoryItem}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't completed any matches yet.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 20, paddingTop: 8 },
  backButton: { marginBottom: 15 },
  backButtonText: { fontSize: 16, color: "#2563eb", fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20, color: "#1f2937" },
  
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", flex: 1, marginRight: 10 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveBadge: { backgroundColor: "#ef4444" },
  winnerBadge: { backgroundColor: "#10b981" },
  drawBadge: { backgroundColor: "#f59e0b" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  dateText: { fontSize: 14, color: "#6b7280", marginBottom: 15 },
  
  scoreRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: "#e5e7eb" },
  scoreLabel: { fontSize: 15, fontWeight: "600", color: "#4b5563", marginRight: 10 },
  scoreText: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  
  detailsButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#6b7280", fontSize: 16 }
});
