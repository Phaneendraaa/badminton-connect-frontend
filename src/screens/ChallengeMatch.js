import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import api from "../utils/api";
export default function ChallengeMatch({ navigation }) {
  const [matchType, setMatchType] = useState("SINGLES");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    try {
      setLoading(true);

      const response = await api("/challenge-friend/create-room", {
        method: "POST",
        body: JSON.stringify({
          matchType,
        }),
      });

      const room = await response.json();
      console.log("match created id-> ",room.matchId)
      navigation.navigate("Challenge-Room", {
        matchId: room.matchId,
      });
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create room"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Challenge Match</Text>

      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            matchType === "SINGLES" && styles.selectedButton,
          ]}
          onPress={() => setMatchType("SINGLES")}
        >
          <Text
            style={[
              styles.buttonText,
              matchType === "SINGLES" && styles.selectedText,
            ]}
          >
            Singles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            matchType === "DOUBLES" && styles.selectedButton,
          ]}
          onPress={() => setMatchType("DOUBLES")}
        >
          <Text
            style={[
              styles.buttonText,
              matchType === "DOUBLES" && styles.selectedText,
            ]}
          >
            Doubles
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={createRoom}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createText}>Create Room</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedText: {
    color: "#fff",
  },
  createButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});