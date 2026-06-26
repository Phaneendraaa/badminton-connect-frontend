import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function ChallengeRoom({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();
  
  const [mobile, setMobile] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  
  const [matchDetails, setMatchDetails] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Teams assignment state
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);

  // Edit Room Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editType, setEditType] = useState("SINGLES");

  // Input focus states for visual highlights
  const [focusedMobile, setFocusedMobile] = useState(false);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000); // poll every 5s for updates
    return () => clearInterval(interval);
  }, []);

  const fetchRoomData = async () => {
    try {
      // Fetch match details
      const matchRes = await api(`/match-play/${matchId}`);
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatchDetails(matchData.match);
      }

      // Fetch players
      const playersRes = await api(`/challenge-friend/${matchId}/players`);
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }
    } finally {
      setLoadingRoom(false);
    }
  };

  const searchUser = async () => {
    if (!mobile.trim()) {
      Alert.alert("Error", "Please enter a mobile number");
      return;
    }

    try {
      setSearching(true);
      const response = await api("/user/search", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: "+91"+mobile }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "No user found with this mobile number");

      setSearchedUser(data);
    } catch (error) {
      setSearchedUser(null);
      Alert.alert("Not Found", error.message || "No user found");
    } finally {
      setSearching(false);
    }
  };

  const sendInvite = async () => {
    try {
      setSendingInvite(true);
      const response = await api("/challenge-friend/invite", {
        method: "POST",
        body: JSON.stringify({ matchId, phoneNumber: searchedUser.phoneNumber }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        Alert.alert("Success", data.message || "Invite sent successfully");
        setMobile("");
        setSearchedUser(null);
        fetchRoomData();
      } else if (response.status === 409) {
        Alert.alert("Already Exists", data.message || "This player has already been invited");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error or server is down");
    } finally {
      setSendingInvite(false);
    }
  };

  const toggleTeam = (userId, team) => {
    if (team === 'A') {
      setTeamA(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
      setTeamB(prev => prev.filter(id => id !== userId));
    } else {
      setTeamB(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
      setTeamA(prev => prev.filter(id => id !== userId));
    }
  };

  const assignTeams = async () => {
    const totalAssigned = teamA.length + teamB.length;
    if (totalAssigned !== matchDetails.slotsTotal) {
      Alert.alert("Error", `Please assign all ${matchDetails.slotsTotal} players to a team.`);
      return;
    }

    if (teamA.length !== teamB.length) {
      Alert.alert("Error", "Team A and Team B must have an equal number of players.");
      return;
    }
    
    try {
      const response = await api(`/challenge-friend/${matchId}/assign-teams`, {
        method: "POST",
        body: JSON.stringify({ teamAUserIds: teamA, teamBUserIds: teamB }),
      });
      if (response.ok) {
        Alert.alert("Success", "Teams assigned!");
        fetchRoomData();
      } else {
        Alert.alert("Error", "Failed to assign teams.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error");
    }
  };

  const startMatch = async () => {
    try {
      const response = await api(`/match-play/${matchId}/start`, { method: "POST" });
      if (response.ok) {
        navigation.replace("MatchPlay", { matchId });
      }
    } catch (error) {
      Alert.alert("Error", "Network error.");
    }
  };

  const handleDeleteRoom = () => {
    Alert.alert("Delete Room", "Are you sure you want to permanently delete this room?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const res = await api(`/challenge-friend/${matchId}`, { method: "DELETE" });
          if (res.ok) {
            Alert.alert("Success", "Room deleted.");
            navigation.navigate("Requests");
          } else {
            Alert.alert("Error", "Failed to delete room.");
          }
        } catch (e) {
          Alert.alert("Error", "Network error.");
        }
      }}
    ]);
  };

  const submitEdit = async () => {
    try {
      const res = await api(`/challenge-friend/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchName: editName,
          matchType: editType,
          scheduledTime: editTime || null
        })
      });
      if (res.ok) {
        setEditModalVisible(false);
        fetchRoomData();
      } else {
        Alert.alert("Error", "Failed to update room.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error.");
    }
  };

  if (loadingRoom) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentUserData = players.find(p => String(p.userId) === String(user?.userId));
  const isOrganizerFromPlayer = currentUserData?.isOrganizer === true || currentUserData?.organizer === true;
  const isOrganizerFromMatch = String(matchDetails?.organizerId) === String(user?.userId);
  const isOrganizer = isOrganizerFromPlayer || isOrganizerFromMatch;
  const isFull = matchDetails?.slotsJoined === matchDetails?.slotsTotal;
  const isSingles = matchDetails?.matchType === "SINGLES";

  const scheduledDate = matchDetails?.scheduledAt
    ? new Date(matchDetails.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : "";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{matchDetails?.matchName || "Challenge Room"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Lobby Details Card */}
        <View style={styles.cardBorder}>
          <LinearGradient
            colors={['#1E2640', '#121829']}
            style={styles.cardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {scheduledDate ? (
              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.scheduledTime}>{scheduledDate}</Text>
              </View>
            ) : null}

            <View style={styles.roomStatusGrid}>
              <View style={styles.statusCell}>
                <Text style={styles.roomLabel}>LOBBY STATUS</Text>
                <Text style={[styles.roomId, { color: Colors.primary }]}>{matchDetails?.status}</Text>
              </View>
              <View style={styles.statusCell}>
                <Text style={styles.roomLabel}>PLAYERS FILLED</Text>
                <Text style={styles.roomId}>{matchDetails?.slotsJoined} / {matchDetails?.slotsTotal}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Players List */}
        <Text style={styles.sectionTitle}>Players in Lobby</Text>
        {players.map((p, idx) => (
          <View key={p.userId} style={styles.playerCardBorder}>
            <View style={styles.playerCardInner}>
              {p.profilePictureUrl ? (
                <Image source={{ uri: p.profilePictureUrl }} style={styles.playerAvatar} />
              ) : (
                <LinearGradient
                  colors={isSingles ? Colors.accentGreen : Colors.accentPurple}
                  style={styles.defaultAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarInitial}>{(p.name || "?")[0].toUpperCase()}</Text>
                </LinearGradient>
              )}
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {p.name} {p.isOrganizer && <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}> (Org)</Text>}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: p.inviteStatus === "JOINED" ? Colors.primary : Colors.warning }]} />
                  <Text style={styles.playerStatus}>{p.inviteStatus}</Text>
                </View>
              </View>
              
              {isOrganizer && matchDetails?.status === 'PENDING' && isFull && p.inviteStatus === 'JOINED' && (
                <View style={styles.teamSelect}>
                  <TouchableOpacity 
                    style={[styles.teamBtn, teamA.includes(p.userId) && styles.teamBtnActiveA]} 
                    onPress={() => toggleTeam(p.userId, 'A')}
                    activeOpacity={0.8}
                  >
                    <Text style={teamA.includes(p.userId) ? styles.teamBtnTextActive : styles.teamBtnText}>A</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.teamBtn, teamB.includes(p.userId) && styles.teamBtnActiveB]} 
                    onPress={() => toggleTeam(p.userId, 'B')}
                    activeOpacity={0.8}
                  >
                    <Text style={teamB.includes(p.userId) ? styles.teamBtnTextActive : styles.teamBtnText}>B</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Organizer Actions */}
        {isOrganizer && matchDetails?.status === 'PENDING' && isFull && (
          <TouchableOpacity style={styles.buttonWrapper} onPress={assignTeams} activeOpacity={0.85}>
            <LinearGradient colors={Colors.accentGreen} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>Confirm Teams Selection</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isOrganizer && matchDetails?.status === 'CREATED' && (
          <TouchableOpacity style={styles.buttonWrapper} onPress={startMatch} activeOpacity={0.85}>
            <LinearGradient colors={Colors.accentGreen} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>Start Match Play</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {(matchDetails?.status === 'PLAYING' || matchDetails?.status === 'FINISHED') && (
          <TouchableOpacity style={styles.buttonWrapper} onPress={() => navigation.navigate("MatchPlay", { matchId })} activeOpacity={0.85}>
            <LinearGradient colors={Colors.accentPurple} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>Go to Live Match Score</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isOrganizer && (matchDetails?.status === 'PENDING' || matchDetails?.status === 'CREATED') && (
          <View style={styles.adminActions}>
            <TouchableOpacity 
              style={[styles.smallBtn, { backgroundColor: '#F59E0B' }]} 
              onPress={() => {
                setEditName(matchDetails?.matchName || "");
                setEditType(matchDetails?.matchType || "SINGLES");
                setEditTime(matchDetails?.scheduledAt || "");
                setEditModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Edit Lobby</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallBtn, { backgroundColor: Colors.danger }]} 
              onPress={handleDeleteRoom}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Delete Lobby</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invite Section — CHALLENGE origin only.
             Open-post organizers fill their match via the join-request system,
             not by directly searching and inviting players by phone number. */}
        {!isFull && matchDetails?.status === 'PENDING' && isOrganizer && matchDetails?.origin === 'CHALLENGE' && (
          <View style={styles.inviteContainer}>
            <Text style={styles.sectionTitle}>Invite Player</Text>
            <View style={[styles.inputWrap, focusedMobile && styles.inputWrapActive]}>
              <TextInput
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={Colors.textTertiary}
                value={mobile}
                onChangeText={setMobile}
                onFocus={() => setFocusedMobile(true)}
                onBlur={() => setFocusedMobile(false)}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
            </View>
            <TouchableOpacity style={styles.buttonWrapper} onPress={searchUser} disabled={searching} activeOpacity={0.85}>
              <LinearGradient colors={Colors.accentPurple} style={styles.searchButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Search User</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {searchedUser && (
              <View style={styles.userCardBorder}>
                <LinearGradient colors={['#1E2640', '#121829']} style={styles.userCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {searchedUser.profilePictureUrl ? (
                    <Image source={{ uri: searchedUser.profilePictureUrl }} style={styles.userAvatarLarge} />
                  ) : (
                    <View style={styles.defaultAvatarLarge}>
                      <Ionicons name="person" size={40} color={Colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.userName}>{searchedUser.name}</Text>
                  <Text style={styles.mobile}>{searchedUser.phoneNumber}</Text>
                  
                  <TouchableOpacity style={styles.buttonWrapper} onPress={sendInvite} disabled={sendingInvite} activeOpacity={0.85}>
                    <LinearGradient colors={Colors.accentGreen} style={styles.inviteButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {sendingInvite ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Invite</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>
        )}

        {/* Open-post organizer waiting state.
             They fill their match via join requests, not by direct invite. */}
        {!isFull && matchDetails?.status === 'PENDING' && isOrganizer && matchDetails?.origin === 'OPEN' && (
          <View style={styles.openPostWaitingContainer}>
            <Ionicons name="time-outline" size={36} color={Colors.textTertiary} />
            <Text style={styles.openPostWaitingTitle}>Waiting for players to join</Text>
            <Text style={styles.openPostWaitingBody}>
              Players can request to join via your public post. Accept or reject them from the post page.
            </Text>
            {matchDetails?.postId && (
              <TouchableOpacity
                style={styles.viewPostBtn}
                onPress={() => navigation.navigate('PostDetail', { postId: matchDetails.postId })}
                activeOpacity={0.85}
              >
                <LinearGradient colors={Colors.accentPurple} style={styles.viewPostBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="document-text-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.buttonText}>View Post & Manage Requests</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Edit Room Modal */}
        <Modal visible={editModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Room Settings</Text>
              
              <Text style={styles.modalLabel}>LOBBY NAME</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={Colors.textTertiary} />
              </View>
              
              <Text style={styles.modalLabel}>MATCH TYPE (SINGLES / DOUBLES)</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={editType} onChangeText={setEditType} placeholderTextColor={Colors.textTertiary} />
              </View>

              <Text style={styles.modalLabel}>SCHEDULED ISO TIME</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={editTime} onChangeText={setEditTime} placeholder="YYYY-MM-DDTHH:mm:ss" placeholderTextColor={Colors.textTertiary} />
              </View>

              <View style={{ flexDirection: 'row', marginTop: Spacing.lg, gap: Spacing.md }}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#475569' }]} onPress={() => setEditModalVisible(false)} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.success }]} onPress={submitEdit} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
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
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
  },

  scheduledTime: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  // Cards
  cardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  cardInner: {
    padding: Spacing.lg,
  },
  roomStatusGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  statusCell: {
    flex: 1,
  },
  roomLabel: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  roomId: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  // Player lobby cards
  playerCardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  playerCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.h3,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  playerStatus: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Team Select inside player card
  teamSelect: {
    flexDirection: 'row',
    gap: 6,
  },
  teamBtn: {
    height: 36,
    width: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  teamBtnActiveA: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teamBtnActiveB: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  teamBtnText: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },
  teamBtnTextActive: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },

  adminActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  smallBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  actionButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: "bold",
    fontSize: Typography.body,
  },

  // Invite player section
  inviteContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrap: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 50,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm + 2,
  },
  inputWrapActive: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },

  // Searched user card
  userCardBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  userCardInner: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  userAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  defaultAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  userName: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mobile: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  inviteButton: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: Typography.label,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPostWaitingContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    alignItems: "center",
  },
  openPostWaitingTitle: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  openPostWaitingBody: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  viewPostBtn: {
    width: "100%",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  viewPostBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
});