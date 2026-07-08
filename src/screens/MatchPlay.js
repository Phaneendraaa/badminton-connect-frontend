import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function MatchPlay({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();
  
  const [matchDetails, setMatchDetails] = useState(null);
  const [sets, setSets] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for new set input — using integer steppers, not free-text
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingSetNum, setEditingSetNum] = useState(null);

  useEffect(() => {
    fetchMatchData();
    const interval = setInterval(() => {
      fetchMatchData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatchData = async (showLoading = true) => {
    if (showLoading && loading) setLoading(true);
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

  const teamASetWins = sets.filter(s => s.setWinner === "TEAM_A").length;
  const teamBSetWins = sets.filter(s => s.setWinner === "TEAM_B").length;

  const saveSet = async (setNum, aScore, bScore) => {
    if (aScore === bScore) {
      Alert.alert("Invalid", "Scores cannot be tied in a set");
      return;
    }
    try {
      setSaving(true);
      const res = await api(`/match-play/${matchId}/set`, {
        method: "POST",
        body: JSON.stringify({
          setNumber: setNum,
          teamAScore: aScore,
          teamBScore: bScore
        })
      });
      if (res.ok) {
        setTeamAScore(0);
        setTeamBScore(0);
        setEditingSetNum(null);
        await fetchMatchData();
        Alert.alert("Success", `Set ${setNum} saved! ⚡`);
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
    setTeamAScore(s.teamAScore);
    setTeamBScore(s.teamBScore);
    setEditingSetNum(s.setNumber);
    Alert.alert("Edit Set", `Now editing Set ${s.setNumber}. Adjust the scores and press Update.`);
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
        Alert.alert("Match Complete!", "The ELO scores have been adjusted successfully. 🏆");
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isCompleted = matchDetails?.status === "COMPLETED";
  const isPlaying = matchDetails?.status === "PLAYING";
  const isOrganizer = String(user?.userId) === String(matchDetails?.organizerId);

  const scheduledDate = matchDetails?.scheduledAt
    ? new Date(matchDetails.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{matchDetails?.matchName || "Match Play"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Header Details */}
        <View style={styles.detailsHeader}>
          {scheduledDate && (
            <View style={styles.timeRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.scheduledTime}>{scheduledDate}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.completedBadge : styles.playingBadge,
            ]}
          >
            <Text style={styles.statusText}>{matchDetails?.status}</Text>
          </View>
        </View>

        {/* Teams Side-by-Side Display */}
        <View style={styles.teamsContainer}>
          {/* Team A Card */}
          <View style={styles.teamCard}>
            <LinearGradient
              colors={['#1E3A8A', '#0F172A']}
              style={styles.teamHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.teamHeaderText}>{matchDetails?.teamAName || "Team A"}</Text>
              <Text style={styles.setWinCount}>{teamASetWins} sets</Text>
            </LinearGradient>
            <View style={styles.teamBody}>
              {teamAPlayers.map((p, idx) => (
                <View key={p.userId} style={[styles.playerItem, idx > 0 && styles.playerItemDivider]}>
                  {p.profilePictureUrl ? (
                    <Image source={{ uri: p.profilePictureUrl }} style={styles.playerPic} />
                  ) : (
                    <LinearGradient
                      colors={Colors.accentGreen}
                      style={styles.defaultPic}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.defaultPicText}>{p.name?.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.playerElo}>ELO: {p.eloBefore}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Team B Card */}
          <View style={styles.teamCard}>
            <LinearGradient
              colors={['#7F1D1D', '#0F172A']}
              style={styles.teamHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.teamHeaderText}>{matchDetails?.teamBName || "Team B"}</Text>
              <Text style={styles.setWinCount}>{teamBSetWins} sets</Text>
            </LinearGradient>
            <View style={styles.teamBody}>
              {teamBPlayers.map((p, idx) => (
                <View key={p.userId} style={[styles.playerItem, idx > 0 && styles.playerItemDivider]}>
                  {p.profilePictureUrl ? (
                    <Image source={{ uri: p.profilePictureUrl }} style={styles.playerPic} />
                  ) : (
                    <LinearGradient
                      colors={Colors.accentPurple}
                      style={styles.defaultPic}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.defaultPicText}>{p.name?.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.playerElo}>ELO: {p.eloBefore}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Sets Scoreboard */}
        {sets.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Set Scores</Text>
            {sets.map((s) => (
              <View key={s.id} style={styles.setRowBorder}>
                <LinearGradient
                  colors={['#1E2640', '#121829']}
                  style={styles.setRow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.setNum}>Set {s.setNumber}</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreText, s.setWinner === "TEAM_A" && styles.winnerScore]}>
                      {s.teamAScore}
                    </Text>
                    <Text style={styles.scoreDivider}>–</Text>
                    <Text style={[styles.scoreText, s.setWinner === "TEAM_B" && styles.winnerScore]}>
                      {s.teamBScore}
                    </Text>
                  </View>
                  
                  <LinearGradient
                    colors={s.setWinner === "TEAM_A" ? ['#3b82f6', '#1D4ED8'] : ['#ef4444', '#B91C1C']}
                    style={styles.winnerBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.winnerBadgeText}>{s.setWinner === "TEAM_A" ? "A" : "B"}</Text>
                  </LinearGradient>

                  {isPlaying && isOrganizer && (
                    <View style={styles.setActions}>
                      <TouchableOpacity onPress={() => handleEditSet(s)} style={styles.setActBtn}>
                        <Ionicons name="pencil" size={18} color="#F59E0B" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteSet(s.setNumber)} style={styles.setActBtn}>
                        <Ionicons name="trash" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {/* Add / Edit Score Form */}
        {isPlaying && isOrganizer && (
          <View style={styles.newSetCard}>
            <View style={styles.newSetHeader}>
              <Text style={styles.newSetTitle}>
                {editingSetNum ? `Modify Set ${editingSetNum}` : `Enter Score - Set ${currentSetNumber}`}
              </Text>
              {editingSetNum !== null && (
                <TouchableOpacity onPress={() => { setEditingSetNum(null); setTeamAScore(""); setTeamBScore(""); }} activeOpacity={0.8}>
                  <Text style={styles.cancelEditText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

          {/* +/− Stepper Score Input */}
          <View style={styles.scoreInputContainer}>
            {/* Team A Stepper */}
            <View style={styles.scoreInputGroup}>
              <Text style={styles.inputLabel}>{matchDetails?.teamAName || "TEAM A"}</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTeamAScore(Math.max(0, teamAScore - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperDisplay}>
                  <Text style={styles.stepperValue}>{teamAScore}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTeamAScore(teamAScore + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputVs}>VS</Text>

            {/* Team B Stepper */}
            <View style={styles.scoreInputGroup}>
              <Text style={styles.inputLabel}>{matchDetails?.teamBName || "TEAM B"}</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTeamBScore(Math.max(0, teamBScore - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperDisplay}>
                  <Text style={styles.stepperValue}>{teamBScore}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTeamBScore(teamBScore + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={() => saveSet(editingSetNum || currentSetNumber, teamAScore, teamBScore)}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Colors.accentGreen}
                style={styles.saveBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={styles.btnText}>{editingSetNum ? "Update Set Score" : "Submit Set Score"}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isPlaying && !isOrganizer && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.waitingText}>Lobby active. Waiting for host to update set scores...</Text>
          </View>
        )}

        {/* Finish Match Button */}
        {isPlaying && isOrganizer && sets.length > 0 && (
          <TouchableOpacity style={styles.buttonWrapper} onPress={confirmFinishMatch} activeOpacity={0.85}>
            <LinearGradient
              colors={Colors.accentOrange}
              style={styles.finishBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Finish & Lock Match Results</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Completed Match Summary */}
        {isCompleted && (
          <View style={styles.resultCardBorder}>
            <LinearGradient
              colors={['#1E2640', '#121829']}
              style={styles.resultCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.resultTitle}>{matchDetails.winnerTeam ? "🏆 Match Complete" : "🤝 Draw Match"}</Text>
              
              <View style={styles.winnerAnnounceBorder}>
                <LinearGradient
                  colors={matchDetails.winnerTeam === "TEAM_A" ? ['rgba(30,58,138,0.3)', 'rgba(0,0,0,0)'] : matchDetails.winnerTeam === "TEAM_B" ? ['rgba(127,29,29,0.3)', 'rgba(0,0,0,0)'] : ['rgba(245,158,11,0.1)', 'rgba(0,0,0,0)']}
                  style={styles.winnerAnnounce}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <Text style={[styles.resultWinner, !matchDetails.winnerTeam && { color: "#D97706" }]}>
                    {matchDetails.winnerTeam === "TEAM_A" ? "Winners: Team A" : matchDetails.winnerTeam === "TEAM_B" ? "Winners: Team B" : "Match Draw"}
                  </Text>
                  <Text style={styles.resultScore}>
                    Sets Summary: {teamASetWins} – {teamBSetWins}
                  </Text>
                </LinearGradient>
              </View>

              <Text style={styles.eloTitle}>ELO rating updates</Text>
              {players.map((p, idx) => {
                const eloDiff = p.eloChange || 0;
                const isGain = eloDiff >= 0;
                return (
                  <View key={p.userId} style={[styles.eloRow, idx > 0 && styles.playerItemDivider]}>
                    <Text style={styles.eloPlayerName} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.eloTeamBadge, p.team === "TEAM_A" ? styles.badgeA : styles.badgeB]}>
                      Team {p.team === "TEAM_A" ? "A" : "B"}
                    </Text>
                    
                    <View style={styles.eloScoreContainer}>
                      {p.eloChange != null ? (
                        <Text style={[styles.eloChangeText, { color: isGain ? Colors.primary : Colors.danger }]}>
                          {isGain ? `+${eloDiff}` : eloDiff} ELO ({p.eloAfter})
                        </Text>
                      ) : (
                        <Text style={styles.eloChangeTextMuted}>—</Text>
                      )}
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.buttonWrapper} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <LinearGradient
                  colors={Colors.accentGreen}
                  style={styles.doneBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.btnText}>Back to Dashboard</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
  },

  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduledTime: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  completedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  playingBadge: {
    backgroundColor: "rgba(0, 245, 160, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.25)",
  },
  statusText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Teams Grid
  teamsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: Spacing.lg,
  },
  teamCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    ...Shadow.md,
  },
  teamHeader: {
    paddingVertical: Spacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  teamHeaderText: {
    color: "#FFFFFF",
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },
  setWinCount: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  teamBody: {
    paddingHorizontal: Spacing.sm,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
  },
  playerItemDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  playerPic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  defaultPic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultPicText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.bodySmall,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  playerElo: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  vsContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  vsText: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.extraBold,
    color: Colors.textTertiary,
  },

  // Sets List
  sectionWrap: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  setRowBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  setNum: {
    fontWeight: FontWeight.bold,
    width: 60,
    color: Colors.textPrimary,
    fontSize: Typography.bodySmall,
  },
  scoreRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scoreText: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.extraBold,
    color: Colors.textTertiary,
  },
  winnerScore: {
    color: Colors.textPrimary,
  },
  scoreDivider: {
    fontSize: Typography.h3,
    color: Colors.border,
  },
  winnerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  winnerBadgeText: {
    color: "#FFFFFF",
    fontWeight: FontWeight.bold,
    fontSize: Typography.caption,
  },
  setActions: {
    flexDirection: 'row',
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  setActBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // New Score Box
  newSetCard: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  newSetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  newSetTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cancelEditText: {
    color: Colors.danger,
    fontWeight: FontWeight.bold,
    fontSize: Typography.caption,
  },
  scoreInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  scoreInputGroup: {
    alignItems: "center",
  },
  inputLabel: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  scoreInputWrap: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    width: 72,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  // Stepper controls
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperDisplay: {
    width: 66,
    height: 66,
    borderRadius: Radius.md,
    backgroundColor: "rgba(9,13,26,0.7)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  inputVs: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.extraBold,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.xl,
    paddingTop: 18,
  },

  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  saveBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  doneBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  btnText: {
    color: Colors.textInverse,
    fontWeight: "bold",
    fontSize: Typography.body,
  },

  waitingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  waitingText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Results Card
  resultCardBorder: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadow.lg,
  },
  resultCard: {
    padding: Spacing.lg,
  },
  resultTitle: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  winnerAnnounceBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  winnerAnnounce: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  resultWinner: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  resultScore: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  eloTitle: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  eloRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
  },
  eloPlayerName: {
    flex: 1,
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  eloTeamBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginRight: Spacing.md,
    fontWeight: "bold",
    fontSize: 10,
    overflow: "hidden",
    color: "#FFFFFF",
  },
  badgeA: {
    backgroundColor: '#1E3A8A',
  },
  badgeB: {
    backgroundColor: '#7F1D1D',
  },
  eloScoreContainer: {
    width: 130,
    alignItems: "flex-end",
  },
  eloChangeText: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.bold,
  },
  eloChangeTextMuted: {
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
  },
});
