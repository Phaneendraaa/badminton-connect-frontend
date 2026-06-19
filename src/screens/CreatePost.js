import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function CreatePost({ navigation }) {
  const [matchType, setMatchType] = useState("SINGLES");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState(""); // YYYY-MM-DD
  const [scheduledTime, setScheduledTime] = useState(""); // HH:MM
  const [eloMin, setEloMin] = useState("");
  const [eloMax, setEloMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Client-side validation mirroring the backend's checks.
  // Server validation is the source of truth; this is purely for UX.
  const validate = () => {
    const errs = {};

    if (!location.trim()) {
      errs.location = "Location is required";
    }

    if (!scheduledDate.trim() || !scheduledTime.trim()) {
      errs.scheduledAt = "Date and time are required";
    } else {
      const dt = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (isNaN(dt.getTime())) {
        errs.scheduledAt = "Invalid date or time format";
      } else if (dt <= new Date()) {
        errs.scheduledAt = "Scheduled time must be in the future";
      }
    }

    const minVal = parseInt(eloMin, 10);
    const maxVal = parseInt(eloMax, 10);

    if (eloMin.trim() === "" || isNaN(minVal) || minVal < 0) {
      errs.eloMin = "Enter a valid ELO minimum (≥ 0)";
    }
    if (eloMax.trim() === "" || isNaN(maxVal) || maxVal < 0) {
      errs.eloMax = "Enter a valid ELO maximum (≥ 0)";
    }
    if (!errs.eloMin && !errs.eloMax && minVal > maxVal) {
      errs.eloMin = "ELO minimum cannot exceed ELO maximum";
    }

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

    setSubmitting(true);
    try {
      const response = await api("/match-post/create", {
        method: "POST",
        body: JSON.stringify({
          matchType,
          location: location.trim(),
          scheduledAt,
          eloMin: parseInt(eloMin, 10),
          eloMax: parseInt(eloMax, 10),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      Alert.alert("Success", "Your match post is now live!", [
        {
          text: "View Post",
          onPress: () =>
            navigation.replace("PostDetail", { postId: data.postId }),
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, error, children }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Match Post</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Match Type */}
          <Field label="Match Type">
            <View style={styles.toggleRow}>
              {["SINGLES", "DOUBLES"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleBtn, matchType === type && styles.toggleBtnActive]}
                  onPress={() => setMatchType(type)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      matchType === type && styles.toggleBtnTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Location */}
          <Field label="Location" error={errors.location}>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="e.g. Badminton Court, MG Road"
              placeholderTextColor={Colors.textTertiary}
              value={location}
              onChangeText={(t) => {
                setLocation(t);
                setErrors((prev) => ({ ...prev, location: undefined }));
              }}
            />
          </Field>

          {/* Date and Time */}
          <Field label="Scheduled Date & Time" error={errors.scheduledAt}>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: Spacing.sm }, errors.scheduledAt && styles.inputError]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textTertiary}
                value={scheduledDate}
                onChangeText={(t) => {
                  setScheduledDate(t);
                  setErrors((prev) => ({ ...prev, scheduledAt: undefined }));
                }}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, { flex: 1 }, errors.scheduledAt && styles.inputError]}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textTertiary}
                value={scheduledTime}
                onChangeText={(t) => {
                  setScheduledTime(t);
                  setErrors((prev) => ({ ...prev, scheduledAt: undefined }));
                }}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </Field>

          {/* ELO Range */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ELO Range</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <TextInput
                  style={[styles.input, errors.eloMin && styles.inputError]}
                  placeholder="Min (e.g. 800)"
                  placeholderTextColor={Colors.textTertiary}
                  value={eloMin}
                  onChangeText={(t) => {
                    setEloMin(t);
                    setErrors((prev) => ({ ...prev, eloMin: undefined }));
                  }}
                  keyboardType="number-pad"
                />
                {errors.eloMin ? <Text style={styles.errorText}>{errors.eloMin}</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, errors.eloMax && styles.inputError]}
                  placeholder="Max (e.g. 1200)"
                  placeholderTextColor={Colors.textTertiary}
                  value={eloMax}
                  onChangeText={(t) => {
                    setEloMax(t);
                    setErrors((prev) => ({ ...prev, eloMax: undefined }));
                  }}
                  keyboardType="number-pad"
                />
                {errors.eloMax ? <Text style={styles.errorText}>{errors.eloMax}</Text> : null}
              </View>
            </View>
          </View>

          {/* Slots info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {matchType === "SINGLES"
                ? "Singles: 2 players total (you + 1)"
                : "Doubles: 4 players total (you + 3)"}
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>Post Open Match</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

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
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  fieldGroup: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  inputError: { borderColor: Colors.danger },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.caption,
    marginTop: 4,
  },
  row: { flexDirection: "row" },

  toggleRow: { flexDirection: "row", gap: Spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  toggleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  toggleBtnText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: { color: Colors.primary },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    flex: 1,
  },

  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadow.md,
  },
  submitBtnDisabled: { backgroundColor: Colors.disabled },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
  },
});
