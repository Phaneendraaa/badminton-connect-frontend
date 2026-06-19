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
      Alert.alert("Error", "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    try {
      const response = await api(`/challenge-friend/accept-invite/${matchId}`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Invite accepted! 🎉");
        fetchData(); // Refresh list
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
            onPress={() => handleAccept(item.matchId)}
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
            onPress={() => handleDecline(item.matchId)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: Colors.danger }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRoomItem = ({ item }) => (
    <View style={styles.cardBorder}>
      <LinearGradient
        colors={['#1E2640', '#121829']}
        style={styles.cardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardTitle}>{item.matchName || `Match: ${item.matchType}`}</Text>
        
        {item.scheduledAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardSub}>
              {new Date(item.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.cardSub}>Slots filled: {item.slotsJoined} / {item.slotsTotal}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="sync-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.cardSub}>Lobby status: {item.status}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => navigation.navigate("Challenge-Room", { matchId: item.matchId })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.accentPurple}
              style={styles.actionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Open Room</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            Invites
          </Text>
          {activeTab === "requests" && (
            <LinearGradient colors={Colors.accentGreen} style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "rooms" && styles.activeTab]}
          onPress={() => setActiveTab("rooms")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "rooms" && styles.activeTabText]}>
            Active Lobbies
          </Text>
          {activeTab === "rooms" && (
            <LinearGradient colors={Colors.accentGreen} style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>
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
          <Text style={styles.statsText}>Track matches you've requested to join and manage requests on your own posts.</Text>
        </LinearGradient>
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === "requests" ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-unread-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No pending invites.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.matchId.toString()}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>You haven't joined or created any rooms.</Text>
            </View>
          }
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
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
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

  // Lists
  list: {
    padding: Spacing.md,
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
  cardTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
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
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: "center",
  },
});
