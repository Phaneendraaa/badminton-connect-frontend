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
import api from "../utils/api";

export default function Requests({ navigation }) {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" or "rooms"
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "requests") {
        const response = await api("/challenge-friend/my-requests", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } else {
        const response = await api("/challenge-friend/my-rooms", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          const activeRooms = data.filter(room => room.status !== 'COMPLETED' && room.status !== 'PLAYING');
          setRooms(activeRooms);
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    try {
      const response = await api(`/challenge-friend/accept-invite/${matchId}`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Invite accepted!");
        fetchData(); // Refresh list
        // Optionally navigate to room
        // navigation.navigate("Challenge-Room", { matchId });
      } else {
        Alert.alert("Error", "Failed to accept invite.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error");
    }
  };

  const handleDecline = async (matchId) => {
    try {
      const response = await api(`/challenge-friend/decline-invite/${matchId}`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Invite declined.");
        fetchData(); // Refresh list
      } else {
        Alert.alert("Error", "Failed to decline invite.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error");
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
      <Text style={styles.cardSub}>Invite from {item.organizerName}</Text>
      {item.scheduledAt && (
         <Text style={styles.cardSub}>📅 {new Date(item.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
      )}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.matchId)}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(item.matchId)}>
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRoomItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
      {item.scheduledAt && (
         <Text style={styles.cardSub}>📅 {new Date(item.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
      )}
      <Text style={styles.cardSub}>Slots: {item.slotsJoined} / {item.slotsTotal}</Text>
      <Text style={styles.cardSub}>Status: {item.status}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.viewRoomButton}
          onPress={() => navigation.navigate("Challenge-Room", { matchId: item.matchId })}
        >
          <Text style={styles.buttonText}>View Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            My Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rooms" && styles.activeTab]}
          onPress={() => setActiveTab("rooms")}
        >
          <Text style={[styles.tabText, activeTab === "rooms" && styles.activeTabText]}>
            My Rooms
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : activeTab === "requests" ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderRequestItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderRoomItem}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't joined or created any rooms.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  tabContainer: { flexDirection: "row", backgroundColor: "#fff", elevation: 2 },
  tab: { flex: 1, paddingVertical: 16, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#6b7280" },
  activeTabText: { color: "#2563eb" },
  card: { backgroundColor: "#fff", margin: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#1f2937" },
  cardSub: { fontSize: 14, color: "#4b5563", marginBottom: 4 },
  actionRow: { flexDirection: "row", marginTop: 12, gap: 12 },
  acceptButton: { flex: 1, backgroundColor: "#22c55e", padding: 10, borderRadius: 8, alignItems: "center" },
  declineButton: { flex: 1, backgroundColor: "#ef4444", padding: 10, borderRadius: 8, alignItems: "center" },
  viewRoomButton: { flex: 1, backgroundColor: "#3b82f6", padding: 10, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#6b7280", fontSize: 16 }
});
