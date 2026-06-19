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
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

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
      } else {
        const errText = await matchRes.text();
        console.error("Match API Error:", matchRes.status, errText);
        // Only alert once to avoid spamming the user on polling
        if (!matchDetails) {
            alert(`Match API Error: ${matchRes.status} - ${errText.substring(0, 50)}`);
        }
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
    return <View style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const currentUserData = players.find(p => String(p.userId) === String(user?.userId));
  const isOrganizerFromPlayer = currentUserData?.isOrganizer === true || currentUserData?.organizer === true;
  const isOrganizerFromMatch = String(matchDetails?.organizerId) === String(user?.userId);
  const isOrganizer = isOrganizerFromPlayer || isOrganizerFromMatch;
  const isFull = matchDetails?.slotsJoined === matchDetails?.slotsTotal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{matchDetails?.matchName || "Challenge Room"}</Text>
      {matchDetails?.scheduledAt && (
        <Text style={styles.scheduledTime}>📅 {new Date(matchDetails.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
      )}

      <View style={styles.roomCard}>
        <Text style={styles.roomLabel}>Room Status</Text>
        <Text style={styles.roomId}>{matchDetails?.status}</Text>
        <Text style={styles.roomLabel}>Slots</Text>
        <Text style={styles.roomId}>{matchDetails?.slotsJoined} / {matchDetails?.slotsTotal}</Text>
      </View>

      <Text style={styles.sectionTitle}>Players in Room</Text>
      {players.map(p => (
        <View key={p.userId} style={styles.playerRow}>
          {p.profilePictureUrl ? (
             <Image source={{ uri: p.profilePictureUrl }} style={styles.playerAvatar} />
          ) : (
             <View style={styles.defaultAvatar} />
          )}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{p.name} {p.isOrganizer && "(Org)"}</Text>
            <Text style={styles.playerStatus}>{p.inviteStatus}</Text>
          </View>
          
          {isOrganizer && matchDetails?.status === 'PENDING' && isFull && p.inviteStatus === 'JOINED' && (
            <View style={styles.teamSelect}>
               <TouchableOpacity 
                  style={[styles.teamBtn, teamA.includes(p.userId) && styles.teamBtnActive]} 
                  onPress={() => toggleTeam(p.userId, 'A')}>
                 <Text style={teamA.includes(p.userId) ? styles.teamBtnTextActive : styles.teamBtnText}>A</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  style={[styles.teamBtn, teamB.includes(p.userId) && styles.teamBtnActive]} 
                  onPress={() => toggleTeam(p.userId, 'B')}>
                 <Text style={teamB.includes(p.userId) ? styles.teamBtnTextActive : styles.teamBtnText}>B</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {isOrganizer && matchDetails?.status === 'PENDING' && isFull && (
         <TouchableOpacity style={styles.actionButton} onPress={assignTeams}>
           <Text style={styles.buttonText}>Confirm Teams</Text>
         </TouchableOpacity>
      )}

      {isOrganizer && matchDetails?.status === 'CREATED' && (
         <TouchableOpacity style={styles.actionButton} onPress={startMatch}>
           <Text style={styles.buttonText}>Start Match</Text>
         </TouchableOpacity>
      )}

      {(matchDetails?.status === 'PLAYING' || matchDetails?.status === 'FINISHED') && (
         <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#3b82f6'}]} onPress={() => navigation.navigate("MatchPlay", { matchId })}>
            <Text style={styles.buttonText}>Go to Match Details</Text>
         </TouchableOpacity>
      )}

      {isOrganizer && (matchDetails?.status === 'PENDING' || matchDetails?.status === 'CREATED') && (
         <View style={styles.adminActions}>
           <TouchableOpacity 
             style={[styles.actionButton, { flex: 1, backgroundColor: '#f59e0b', marginRight: 10 }]} 
             onPress={() => {
               setEditName(matchDetails?.matchName || "");
               setEditType(matchDetails?.matchType || "SINGLES");
               setEditTime(matchDetails?.scheduledAt || "");
               setEditModalVisible(true);
             }}
           >
             <Text style={styles.buttonText}>Edit Room</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.actionButton, { flex: 1, backgroundColor: '#ef4444' }]} 
             onPress={handleDeleteRoom}
           >
             <Text style={styles.buttonText}>Delete Room</Text>
           </TouchableOpacity>
         </View>
      )}

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Room</Text>
            
            <Text style={styles.label}>Match Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            
            <Text style={styles.label}>Match Type (SINGLES/DOUBLES)</Text>
            <TextInput style={styles.input} value={editType} onChangeText={setEditType} />

            <Text style={styles.label}>Scheduled Time (ISO)</Text>
            <TextInput style={styles.input} value={editTime} onChangeText={setEditTime} placeholder="YYYY-MM-DDTHH:mm:ss" />

            <View style={{flexDirection: 'row', marginTop: 20}}>
              <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#6b7280', marginRight: 10}]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#2563eb'}]} onPress={submitEdit}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!isFull && matchDetails?.status === 'PENDING' && isOrganizer && (
        <>
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Invite Player</Text>
          <TextInput
            placeholder="Enter mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchUser} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Search Player</Text>}
          </TouchableOpacity>

          {searchedUser && (
            <View style={styles.userCard}>
              <Image
                source={{ uri: searchedUser.profilePictureUrl || "https://via.placeholder.com/150" }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{searchedUser.name}</Text>
              <Text style={styles.mobile}>{searchedUser.mobileNumber}</Text>
              <TouchableOpacity style={styles.inviteButton} onPress={sendInvite} disabled={sendingInvite}>
                {sendingInvite ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Invite To Room</Text>}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 50 },
  backButton: { marginBottom: 15, padding: 40 },
  backButtonText: { fontSize: 16, color: "#2563eb", fontWeight: "600"},
  title: { fontSize: 28, fontWeight: "700", marginBottom: 5 },
  scheduledTime: { fontSize: 16, color: "#4b5563", marginBottom: 20 },
  roomCard: { backgroundColor: "#f5f5f5", padding: 15, borderRadius: 12, marginBottom: 25 },
  roomLabel: { fontSize: 12, color: "#666", marginTop: 8 },
  roomId: { marginTop: 4, fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 10 },
  playerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  defaultAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#ccc' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: 'bold' },
  playerStatus: { fontSize: 12, color: '#666' },
  teamSelect: { flexDirection: 'row', gap: 5 },
  teamBtn: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: 40, alignItems: 'center' },
  teamBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  teamBtnText: { color: '#333' },
  teamBtnTextActive: { color: "#fff", fontWeight: "bold" },
  adminActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, color: '#374151', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  modalButton: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  actionButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  searchButton: { height: 50, backgroundColor: "#2563eb", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  userCard: { marginTop: 25, borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 15, padding: 20, alignItems: "center" },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "700" },
  mobile: { color: "#666", marginTop: 5, marginBottom: 20 },
  inviteButton: { backgroundColor: "#22c55e", height: 50, paddingHorizontal: 25, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});