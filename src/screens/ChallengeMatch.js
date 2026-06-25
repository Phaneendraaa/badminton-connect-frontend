import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function ChallengeMatch({ navigation }) {
  const [matchType, setMatchType] = useState("SINGLES");
  const [matchName, setMatchName] = useState("");
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
          scheduledTime: scheduledTime.toISOString().slice(0, 19),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to create room");
        return;
      }

      // Navigate to the unified My Rooms tab (Activity Main)
      navigation.navigate("ActivityTab", {
        screen: "ActivityMain",
      });
    } catch (error) {
      Alert.alert("Error", "Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#111827"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Challenge Friend</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Set Up Match Lobby</Text>
              <Text style={styles.cardSubtitle}>Configure your match settings and invite friends to play</Text>

              {/* Match Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lobby Name</Text>
                <View
                  style={[
                    styles.inputWrap,
                    isFocused && styles.inputWrapActive,
                  ]}
                >
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Sunday Morning Friendlies"
                    placeholderTextColor={Colors.textTertiary}
                    value={matchName}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChangeText={setMatchName}
                  />
                </View>
              </View>

              {/* Scheduled Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Scheduled Time</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.datePickerText}>
                    {scheduledTime.toLocaleString([], {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={scheduledTime}
                    mode="datetime"
                    is24Hour={false}
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowPicker(false);
                      if (selectedDate) setScheduledTime(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* Match Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Match Mode</Text>
                <View style={styles.typeContainer}>
                  {["SINGLES", "DOUBLES"].map((type) => {
                    const isActive = matchType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeButton, isActive && styles.typeButtonActive]}
                        onPress={() => setMatchType(type)}
                        activeOpacity={0.8}
                      >
                        {isActive ? (
                          <LinearGradient
                            colors={type === "SINGLES" ? Colors.accentGreen : Colors.accentPurple}
                            style={styles.typeGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={[styles.buttonText, { color: Colors.textInverse }]}>
                              {type.charAt(0) + type.slice(1).toLowerCase()}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.buttonText}>{type.charAt(0) + type.slice(1).toLowerCase()}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Slots Info Banner */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.infoText}>
                  {matchType === "SINGLES"
                    ? "Singles challenge lobby: 2 players max."
                    : "Doubles challenge lobby: 4 players max."}
                </Text>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={styles.createBtnWrapper}
                onPress={createRoom}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={loading ? [Colors.disabled, Colors.disabled] : Colors.accentGreen}
                  style={styles.createButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.createText}>Initialize Lobby</Text>
                      <Ionicons name="sparkles-outline" size={18} color={Colors.textInverse} style={{ marginLeft: Spacing.sm }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: "center",
  },

  // Frosted Card
  card: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },

  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  inputWrap: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
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
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  datePickerText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },

  // Toggles
  typeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 50,
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.15)",
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Create Button
  createBtnWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
    ...Shadow.md,
  },
  createButton: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  createText: {
    color: Colors.textInverse,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
});