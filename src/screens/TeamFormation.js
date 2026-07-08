import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

/**
 * TeamFormation screen
 * Organizer assigns accepted players to Team A / Team B and optionally renames teams.
 * Navigates from PostDetail when post.status === "FULL" and user is organizer.
 *
 * Route params: { matchId }
 */
export default function TeamFormation({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();

  const [matchDetail, setMatchDetail] = useState(null);
  const [players, setPlayers] = useState([]); // MatchPlayerDto[]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Team assignments: map from userId → "A" | "B" | null
  const [assignments, setAssignments] = useState({});

  // Custom team names
  const [teamAName, setTeamAName] = useState("Team A");
  const [teamBName, setTeamBName] = useState("Team B");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api(`/match-play/${matchId}`);
      if (!res.ok) throw new Error("Failed to load match");
      const data = await res.json();
      setMatchDetail(data.match);
      setPlayers(data.players || []);

      // Pre-populate assignments from existing team values
      const existing = {};
      (data.players || []).forEach((p) => {
        if (p.team === "TEAM_A") existing[p.userId] = "A";
        else if (p.team === "TEAM_B") existing[p.userId] = "B";
        else existing[p.userId] = null;
      });
      setAssignments(existing);

      // Pre-populate names if already set
      if (data.match?.teamAName) setTeamAName(data.match.teamAName);
      if (data.match?.teamBName) setTeamBName(data.match.teamBName);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not load match data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assign = (userId, team) => {
    setAssignments((prev) => ({ ...prev, [userId]: prev[userId] === team ? null : team }));
  };

  const teamAPlayers = players.filter((p) => assignments[p.userId] === "A");
  const teamBPlayers = players.filter((p) => assignments[p.userId] === "B");
  const unassigned = players.filter((p) => !assignments[p.userId]);

  const isSingles = matchDetail?.matchType === "SINGLES";
  const expectedPerTeam = isSingles ? 1 : 2;

  const isValid =
    teamAPlayers.length === expectedPerTeam &&
    teamBPlayers.length === expectedPerTeam &&
    unassigned.length === 0;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert(
        "Incomplete",
        `Each team needs exactly ${expectedPerTeam} player${expectedPerTeam > 1 ? "s" : ""}. ` +
          `Currently: Team A = ${teamAPlayers.length}, Team B = ${teamBPlayers.length}, Unassigned = ${unassigned.length}`
      );
      return;
    }

    setSaving(true);
    try {
      const body = {
        teamAUserIds: teamAPlayers.map((p) => p.userId),
        teamBUserIds: teamBPlayers.map((p) => p.userId),
        teamAName: teamAName.trim() || "Team A",
        teamBName: teamBName.trim() || "Team B",
      };
      const res = await api(`/match-play/${matchId}/assign-teams`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to assign teams");

      Alert.alert("Teams Set! 🏸", "Teams have been assigned. You can now start the match.", [
        {
          text: "Start Match",
          onPress: () => handleStartMatch(),
        },
        {
          text: "Later",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartMatch = async () => {
    setSaving(true);
    try {
      const res = await api(`/match-play/${matchId}/start`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to start match");
      navigation.replace("MatchPlay", { matchId });
    } catch (e) {
      Alert.alert("Error", e.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Formation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Instruction */}
      <View style={styles.instructionWrap}>
        <LinearGradient
          colors={["rgba(0, 245, 160, 0.12)", "rgba(0, 217, 245, 0.04)"]}
          style={styles.instruction}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="people" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.instructionText}>
            Assign each player to a team. Each team needs {expectedPerTeam} player
            {expectedPerTeam > 1 ? "s" : ""}.
          </Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team name inputs */}
        <View style={styles.teamNamesRow}>
          <View style={[styles.nameInputWrap, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.label}>TEAM A NAME</Text>
            <View style={[styles.inputWrap, { borderColor: "#3B82F6" }]}>
              <TextInput
                value={teamAName}
                onChangeText={setTeamAName}
                style={styles.nameInput}
                placeholder="Team A"
                placeholderTextColor={Colors.textTertiary}
                maxLength={20}
              />
            </View>
          </View>
          <View style={{ alignSelf: "flex-end", paddingBottom: 12 }}>
            <Text style={styles.vsLabel}>VS</Text>
          </View>
          <View style={[styles.nameInputWrap, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.label}>TEAM B NAME</Text>
            <View style={[styles.inputWrap, { borderColor: "#EF4444" }]}>
              <TextInput
                value={teamBName}
                onChangeText={setTeamBName}
                style={styles.nameInput}
                placeholder="Team B"
                placeholderTextColor={Colors.textTertiary}
                maxLength={20}
              />
            </View>
          </View>
        </View>

        {/* Two-column team view */}
        <View style={styles.teamsRow}>
          {/* Team A */}
          <View style={[styles.teamCol, { marginRight: Spacing.sm }]}>
            <LinearGradient colors={["#1E3A8A", "#0F172A"]} style={styles.teamHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.teamHeaderText}>{teamAName || "Team A"}</Text>
              <Text style={styles.teamCount}>{teamAPlayers.length}/{expectedPerTeam}</Text>
            </LinearGradient>
            <View style={styles.teamBody}>
              {teamAPlayers.map((p) => (
                <View key={p.userId} style={styles.assignedPlayerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.avatarText}>{(p.name || "?")[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                  <TouchableOpacity onPress={() => assign(p.userId, "A")} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              {teamAPlayers.length < expectedPerTeam && (
                <View style={styles.emptySlot}>
                  <Ionicons name="person-add-outline" size={20} color={Colors.textTertiary} />
                  <Text style={styles.emptySlotText}>Empty slot</Text>
                </View>
              )}
            </View>
          </View>

          {/* Team B */}
          <View style={[styles.teamCol, { marginLeft: Spacing.sm }]}>
            <LinearGradient colors={["#7F1D1D", "#0F172A"]} style={styles.teamHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.teamHeaderText}>{teamBName || "Team B"}</Text>
              <Text style={styles.teamCount}>{teamBPlayers.length}/{expectedPerTeam}</Text>
            </LinearGradient>
            <View style={styles.teamBody}>
              {teamBPlayers.map((p) => (
                <View key={p.userId} style={styles.assignedPlayerRow}>
                  <View style={[styles.playerAvatar, { backgroundColor: "rgba(239,68,68,0.2)" }]}>
                    <Text style={styles.avatarText}>{(p.name || "?")[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                  <TouchableOpacity onPress={() => assign(p.userId, "B")} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              {teamBPlayers.length < expectedPerTeam && (
                <View style={styles.emptySlot}>
                  <Ionicons name="person-add-outline" size={20} color={Colors.textTertiary} />
                  <Text style={styles.emptySlotText}>Empty slot</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Unassigned Players */}
        {unassigned.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>ASSIGN PLAYERS</Text>
            {unassigned.map((p) => (
              <View key={p.userId} style={styles.unassignedCard}>
                <View style={styles.unassignedLeft}>
                  <LinearGradient colors={Colors.accentGreen} style={styles.playerAvatarLarge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.avatarTextLarge}>{(p.name || "?")[0].toUpperCase()}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.unassignedName}>{p.name}</Text>
                    <Text style={styles.unassignedElo}>{p.eloBefore} ELO</Text>
                  </View>
                </View>
                <View style={styles.assignButtons}>
                  <TouchableOpacity
                    style={[styles.assignBtn, { backgroundColor: "rgba(59,130,246,0.15)", borderColor: "#3B82F6" }]}
                    onPress={() => assign(p.userId, "A")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.assignBtnText, { color: "#3B82F6" }]}>→ A</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.assignBtn, { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#EF4444" }]}
                    onPress={() => assign(p.userId, "B")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.assignBtnText, { color: "#EF4444" }]}>→ B</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmWrapper, !isValid && styles.confirmDisabled]}
          onPress={handleSave}
          disabled={saving || !isValid}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isValid ? Colors.accentGreen : ["#374151", "#374151"]}
            style={styles.confirmBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons
                  name={isValid ? "checkmark-circle" : "alert-circle-outline"}
                  size={20}
                  color={isValid ? Colors.textInverse : Colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.confirmText, !isValid && { color: Colors.textTertiary }]}>
                  {isValid ? "Confirm Teams & Proceed" : `${unassigned.length} player${unassigned.length !== 1 ? "s" : ""} unassigned`}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
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
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  instructionWrap: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  instruction: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
  },
  instructionText: { flex: 1, fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: FontWeight.medium },
  content: { padding: Spacing.lg, paddingBottom: 60 },

  // Team name inputs
  teamNamesRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: Spacing.lg },
  nameInputWrap: {},
  label: {
    fontSize: Typography.caption, fontWeight: FontWeight.bold,
    color: Colors.textTertiary, letterSpacing: 1, marginBottom: Spacing.xs,
  },
  inputWrap: {
    backgroundColor: "rgba(9,13,26,0.6)", borderWidth: 1,
    borderRadius: Radius.md, height: 46, paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  nameInput: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  vsLabel: { fontSize: Typography.h3, fontWeight: FontWeight.extraBold, color: Colors.textTertiary, paddingHorizontal: Spacing.sm },

  // Teams columns
  teamsRow: { flexDirection: "row", marginBottom: Spacing.lg },
  teamCol: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, overflow: "hidden" },
  teamHeader: { paddingVertical: Spacing.sm + 2, alignItems: "center" },
  teamHeaderText: { color: "#FFF", fontWeight: FontWeight.bold, fontSize: Typography.bodySmall },
  teamCount: { color: "rgba(255,255,255,0.6)", fontSize: Typography.caption, marginTop: 2 },
  teamBody: { padding: Spacing.sm, minHeight: 60 },
  assignedPlayerRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: Spacing.xs, gap: Spacing.xs,
  },
  playerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: Typography.caption, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  playerName: { flex: 1, fontSize: Typography.caption, color: Colors.textPrimary, fontWeight: FontWeight.semiBold },
  removeBtn: { padding: 2 },
  emptySlot: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: Spacing.sm, opacity: 0.5,
  },
  emptySlotText: { color: Colors.textTertiary, fontSize: Typography.caption },

  // Unassigned
  sectionTitle: {
    fontSize: Typography.caption, fontWeight: FontWeight.bold,
    color: Colors.textSecondary, letterSpacing: 1.5,
    marginBottom: Spacing.sm, textTransform: "uppercase",
  },
  unassignedCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.md,
  },
  unassignedLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  playerAvatarLarge: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  avatarTextLarge: { fontSize: Typography.body, fontWeight: FontWeight.bold, color: Colors.textInverse },
  unassignedName: { fontSize: Typography.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  unassignedElo: { fontSize: Typography.caption, color: Colors.textTertiary },
  assignButtons: { flexDirection: "row", gap: Spacing.sm },
  assignBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.md, borderWidth: 1,
  },
  assignBtnText: { fontWeight: FontWeight.bold, fontSize: Typography.bodySmall },

  // Confirm
  confirmWrapper: { borderRadius: Radius.md, overflow: "hidden", marginTop: Spacing.lg },
  confirmDisabled: { opacity: 0.7 },
  confirmBtn: {
    height: 54, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
  },
  confirmText: {
    color: Colors.textInverse, fontSize: Typography.body, fontWeight: FontWeight.bold,
  },
});
