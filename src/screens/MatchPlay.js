import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function MatchPlay({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();
  
  const [matchDetails, setMatchDetails] = useState(null);
  const [sets, setSets] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for new set input
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingSetNum, setEditingSetNum] = useState(null);

  useEffect(() => {
    fetchMatchData();
    const interval = setInterval(() => {
      fetchMatchData(false); // pass false to avoid showing loading indicator again
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatchData = async () => {
    try {
      const res = await api(`/match-play/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setMatchDetails(data.match);
        setSets(data.sets || []);
        setPlayers(data.players || []);
        if (data.sets && data.sets.length > 0) {
           const maxSet = Math.max(...data.sets.map(s => s.setNumber));
           setCurrentSetNumber(maxSet + 1);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const teamAPlayers = players.filter(p => p.team === "TEAM_A");
  const teamBPlayers = players.filter(p => p.team === "TEAM_B");

  // Count set wins
  const teamASetWins = sets.filter(s => s.setWinner === "TEAM_A").length;
  const teamBSetWins = sets.filter(s => s.setWinner === "TEAM_B").length;

  const saveSet = async (setNum, aScore, bScore) => {
    if (aScore === "" || bScore === "") {
        Alert.alert("Error", "Please enter scores for both teams");
        return;
    }
    const a = parseInt(aScore);
    const b = parseInt(bScore);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
        Alert.alert("Error", "Please enter valid positive scores");
        return;
    }
    if (a === b) {
        Alert.alert("Error", "Scores cannot be tied in a set");
        return;
    }
    try {
      setSaving(true);
      const res = await api(`/match-play/${matchId}/set`, {
        method: "POST",
        body: JSON.stringify({
          setNumber: setNum,
          teamAScore: a,
          teamBScore: b
        })
      });
      if (res.ok) {
        setTeamAScore("");
        setTeamBScore("");
        setEditingSetNum(null);
        await fetchMatchData();
        Alert.alert("Success", `Set ${setNum} saved!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert("Error", errData.message || "Failed to save set");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save set");
    } finally {
      setSaving(false);
    }
  };

  const deleteSet = (setNumber) => {
    Alert.alert(
      "Delete Set?",
      `Are you sure you want to permanently delete Set ${setNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const res = await api(`/match-play/${matchId}/set/${setNumber}`, { method: "DELETE" });
            if (res.ok) {
              await fetchMatchData();
              Alert.alert("Success", `Set ${setNumber} deleted.`);
            } else {
              Alert.alert("Error", "Failed to delete set");
            }
          } catch (err) {
            Alert.alert("Error", "Network error.");
          }
        }}
      ]
    );
  };

  const handleEditSet = (s) => {
    setTeamAScore(s.teamAScore.toString());
    setTeamBScore(s.teamBScore.toString());
    setEditingSetNum(s.setNumber);
    Alert.alert("Edit Set", `Now editing Set ${s.setNumber}. Please enter the corrected scores in the form below and save.`);
  };

  const confirmFinishMatch = () => {
    if (teamASetWins === teamBSetWins) {
      Alert.alert(
        "Sets are Tied",
        `Both teams have won ${teamASetWins} set(s). Finishing now will result in a Draw with no ELO changes. Continue?`,
        [
          { text: "Keep Playing", style: "cancel" },
          { text: "Finish as Draw", onPress: () => doFinishMatch() }
        ]
      );
    } else {
      const leader = teamASetWins > teamBSetWins ? "Team A" : "Team B";
      Alert.alert(
        "Finish Match?",
        `${leader} is leading ${Math.max(teamASetWins, teamBSetWins)}-${Math.min(teamASetWins, teamBSetWins)} in sets. Finish and apply ELO?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Finish Match", onPress: () => doFinishMatch() }
        ]
      );
    }
  };

  const doFinishMatch = async () => {
    try {
      const res = await api(`/match-play/${matchId}/finish`, { method: "POST" });
      if (res.ok) {
        Alert.alert("Match Complete!", "The match has been finished.");
        await fetchMatchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert("Error", errData.message || "Failed to finish match");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to finish match");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isCompleted = matchDetails?.status === "COMPLETED";
  const isPlaying = matchDetails?.status === "PLAYING";
  const isOrganizer = String(user?.userId) === String(matchDetails?.organizerId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 20, paddingBottom: 50}}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{matchDetails?.matchName || "Match Play"}</Text>
      {matchDetails?.scheduledAt && (
        <Text style={styles.scheduledTime}>📅 {new Date(matchDetails.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
      )}
      <View style={styles.statusBadge(isCompleted ? "#059669" : "#2563eb")}>
        <Text style={styles.statusText}>{matchDetails?.status}</Text>
      </View>

      {/* Teams Display */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamCard}>
          <View style={[styles.teamHeader, {backgroundColor: '#3b82f6'}]}>
            <Text style={styles.teamHeaderText}>Team A</Text>
            <Text style={styles.setWinCount}>{teamASetWins} sets won</Text>
          </View>
          {teamAPlayers.map(p => (
            <View key={p.userId} style={styles.playerItem}>
              {p.profilePictureUrl ? (
                <Image source={{ uri: p.profilePictureUrl }} style={styles.playerPic} />
              ) : (
                <View style={[styles.playerPic, styles.defaultPic]}>
                  <Text style={styles.defaultPicText}>{p.name?.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerElo}>ELO: {p.eloBefore}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.teamCard}>
          <View style={[styles.teamHeader, {backgroundColor: '#ef4444'}]}>
            <Text style={styles.teamHeaderText}>Team B</Text>
            <Text style={styles.setWinCount}>{teamBSetWins} sets won</Text>
          </View>
          {teamBPlayers.map(p => (
            <View key={p.userId} style={styles.playerItem}>
              {p.profilePictureUrl ? (
                <Image source={{ uri: p.profilePictureUrl }} style={styles.playerPic} />
              ) : (
                <View style={[styles.playerPic, styles.defaultPic]}>
                  <Text style={styles.defaultPicText}>{p.name?.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerElo}>ELO: {p.eloBefore}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Sets Scoreboard */}
      {sets.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sets</Text>
          {sets.map(s => (
            <View key={s.id} style={styles.setRow}>
              <Text style={styles.setNum}>Set {s.setNumber}</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreText, s.setWinner === "TEAM_A" && styles.winnerScore]}>{s.teamAScore}</Text>
                <Text style={styles.scoreDivider}>–</Text>
                <Text style={[styles.scoreText, s.setWinner === "TEAM_B" && styles.winnerScore]}>{s.teamBScore}</Text>
              </View>
              <View style={[styles.winnerBadge, {backgroundColor: s.setWinner === "TEAM_A" ? "#3b82f6" : "#ef4444"}]}>
                <Text style={styles.winnerBadgeText}>{s.setWinner === "TEAM_A" ? "A" : "B"}</Text>
              </View>
              {isPlaying && isOrganizer && (
                <View style={{flexDirection: 'row', marginLeft: 10, gap: 10}}>
                  <TouchableOpacity onPress={() => handleEditSet(s)}>
                    <Ionicons name="pencil" size={20} color="#f59e0b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSet(s.setNumber)}>
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* Add/Edit Set (only while playing) */}
      {isPlaying && isOrganizer && (
         <View style={styles.newSetCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
               <Text style={styles.cardTitle}>{editingSetNum ? `Edit Set ${editingSetNum}` : `Add Set ${currentSetNumber}`}</Text>
               {editingSetNum !== null && (
                 <TouchableOpacity onPress={() => { setEditingSetNum(null); setTeamAScore(""); setTeamBScore(""); }}>
                    <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Cancel Edit</Text>
                 </TouchableOpacity>
               )}
            </View>
            <View style={styles.inputRow}>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Team A</Text>
                  <TextInput 
                     style={styles.input} 
                     keyboardType="number-pad" 
                     value={teamAScore} 
                     onChangeText={setTeamAScore}
                     placeholder="0"
                  />
               </View>
               <Text style={styles.inputVs}>vs</Text>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Team B</Text>
                  <TextInput 
                     style={styles.input} 
                     keyboardType="number-pad" 
                     value={teamBScore} 
                     onChangeText={setTeamBScore}
                     placeholder="0"
                  />
               </View>
            </View>
            <TouchableOpacity 
               style={[styles.saveBtn, saving && {opacity: 0.7}]} 
               onPress={() => saveSet(editingSetNum || currentSetNumber, teamAScore, teamBScore)} 
               disabled={saving}
            >
               {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editingSetNum ? "Update Set" : "Save Set"}</Text>}
            </TouchableOpacity>
         </View>
      )}

      {isPlaying && !isOrganizer && (
         <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#6b7280", fontStyle: "italic", fontSize: 16 }}>Waiting for organizer to update scores...</Text>
         </View>
      )}

      {/* Finish Match Button */}
      {isPlaying && isOrganizer && sets.length > 0 && (
         <TouchableOpacity style={styles.finishBtn} onPress={confirmFinishMatch}>
            <Text style={styles.btnText}>Finish Match</Text>
         </TouchableOpacity>
      )}

      {/* Match Result (shown after completion) */}
      {isCompleted && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{matchDetails.winnerTeam ? "🏆 Match Result" : "🤝 Match Result"}</Text>
          <Text style={[styles.resultWinner, !matchDetails.winnerTeam && {color: "#d97706"}]}>
            {matchDetails.winnerTeam === "TEAM_A" ? "Winner: Team A" : matchDetails.winnerTeam === "TEAM_B" ? "Winner: Team B" : "Draw — No ELO Changes"}
          </Text>
          <Text style={styles.resultScore}>
            Sets: {teamASetWins} – {teamBSetWins}
          </Text>

          <Text style={styles.eloTitle}>ELO Changes</Text>
          {players.map(p => (
            <View key={p.userId} style={styles.eloRow}>
              <Text style={styles.eloPlayerName}>{p.name}</Text>
              <Text style={styles.eloTeamBadge}>{p.team === "TEAM_A" ? "A" : "B"}</Text>
              {p.eloChange != null ? (
                <Text style={[styles.eloChange, {color: p.eloChange >= 0 ? "#059669" : "#dc2626"}]}>
                  {p.eloChange >= 0 ? "+" : ""}{p.eloChange} → {p.eloAfter}
                </Text>
              ) : (
                <Text style={styles.eloChange}>—</Text>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
  backBtn: { marginBottom: 15 },
  backBtnText: { color: "#2563eb", fontSize: 16, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "bold", color: "#111827", marginBottom: 5 },
  scheduledTime: { fontSize: 16, color: "#4b5563", marginBottom: 15 },
  statusBadge: (color) => ({
    alignSelf: "flex-start",
    backgroundColor: color,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  }),
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  // Teams
  teamsContainer: { marginBottom: 20 },
  teamCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 10, backgroundColor: "#fff" },
  teamHeader: { padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  setWinCount: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  playerItem: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  playerPic: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  defaultPic: { backgroundColor: "#d1d5db", justifyContent: "center", alignItems: "center" },
  defaultPicText: { color: "#4b5563", fontWeight: "bold", fontSize: 16 },
  playerDetails: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  playerElo: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  vsText: { textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#9ca3af", marginVertical: 5 },

  // Sets
  sectionTitle: { fontSize: 20, fontWeight: "600", marginTop: 10, marginBottom: 10, color: "#111827" },
  setRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "#fff", borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  setNum: { fontWeight: "bold", width: 60, color: "#374151" },
  scoreRow: { flexDirection: "row", gap: 10, flex: 1, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 20, fontWeight: "bold", color: "#6b7280" },
  winnerScore: { color: "#111827" },
  scoreDivider: { fontSize: 20, color: "#d1d5db" },
  winnerBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  winnerBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  // New Set Card
  newSetCard: { marginTop: 20, padding: 20, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, backgroundColor: "#fff" },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 15, color: "#111827" },
  inputRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  inputGroup: { flex: 1, alignItems: "center" },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#d1d5db", width: 70, height: 50, textAlign: "center", borderRadius: 10, fontSize: 22, fontWeight: "bold", backgroundColor: "#f9fafb" },
  inputVs: { fontSize: 16, fontWeight: "bold", color: "#9ca3af", marginHorizontal: 15 },
  saveBtn: { backgroundColor: "#3b82f6", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  finishBtn: { backgroundColor: "#10b981", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },

  // Result Card
  resultCard: { marginTop: 20, padding: 20, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  resultTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#111827" },
  resultWinner: { fontSize: 18, fontWeight: "600", textAlign: "center", color: "#059669", marginBottom: 4 },
  resultScore: { fontSize: 16, textAlign: "center", color: "#6b7280", marginBottom: 20 },
  eloTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#374151" },
  eloRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  eloPlayerName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1f2937" },
  eloTeamBadge: { backgroundColor: "#e5e7eb", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 10, fontWeight: "bold", fontSize: 12, overflow: "hidden" },
  eloChange: { fontSize: 14, fontWeight: "bold", width: 100, textAlign: "right" },
  doneBtn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 20 },
});

