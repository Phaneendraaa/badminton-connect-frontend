import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import api from "../utils/api";
export default function ChallengeMatch({ navigation }) {
  const [matchType, setMatchType] = useState("SINGLES");
  const [matchName, setMatchName] = useState("");
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    if (!matchName.trim()) {
      Alert.alert("Required", "Please enter a Match Name");
      return;
    }
    try {
      setLoading(true);

      const response = await api("/challenge-friend/create-room", {
        method: "POST",
        body: JSON.stringify({
          matchType,
          matchName: matchName.trim(),
          scheduledTime: scheduledTime.toISOString(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to create room");
        return;
      }

      console.log("match created id-> ", data.matchId);
      navigation.navigate("Challenge-Room", {
        matchId: data.matchId,
      });
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create Challenge Match</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Match Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Sunday Morning Doubles"
          value={matchName}
          onChangeText={setMatchName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Scheduled Time</Text>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.datePickerText}>
            {scheduledTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={scheduledTime}
            mode="datetime"
            is24Hour={false}
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setScheduledTime(selectedDate);
            }}
          />
        )}
      </View>

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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  datePickerText: {
    fontSize: 16,
    color: "#1f2937",
  },
});