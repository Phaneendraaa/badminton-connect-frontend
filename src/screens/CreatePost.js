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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const Field = ({ label, error, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default function CreatePost({ navigation }) {
  const [title, setTitle] = useState("");
  const [matchType, setMatchType] = useState("SINGLES");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eloMin, setEloMin] = useState("");
  const [eloMax, setEloMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Track active focus fields for custom glow border
  const [focusedField, setFocusedField] = useState(null);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (event.type === "set" && date) {
      const current = selectedDate || new Date();
      current.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(new Date(current));
      setTimeout(() => setShowTimePicker(true), 100);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (event.type === "set" && time) {
      const current = selectedDate || new Date();
      current.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setSelectedDate(new Date(current));
    }
  };

  const validate = () => {
    const errs = {};

    if (!title.trim()) {
      errs.title = "Match title is required";
    } else if (title.trim().length > 100) {
      errs.title = "Match title must be 100 characters or less";
    }

    if (location.trim()) {
      const urlRegex = /^(http:\/\/|https:\/\/)/;
      if (!urlRegex.test(location.trim())) {
        errs.location = "Location must be a valid URL starting with http:// or https://";
      }
    }

    if (!selectedDate) {
      errs.scheduledAt = "Date and time are required";
    } else if (selectedDate <= new Date()) {
      errs.scheduledAt = "Scheduled time must be in the future";
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

    const scheduledAt = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);

    setSubmitting(true);
    try {
      const bodyPayload = {
        title: title.trim(),
        matchType,
        scheduledAt,
        eloMin: parseInt(eloMin, 10),
        eloMax: parseInt(eloMax, 10),
      };
      if (location.trim()) bodyPayload.location = location.trim();
      if (description.trim()) bodyPayload.description = description.trim();

      const response = await api("/match-post/create", {
        method: "POST",
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      Alert.alert("Success", "Your match post is now live! 🏸", [
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Match</Text>
          <View style={{ width: 40 }} />
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
            <Text style={styles.statsText}>Post a match you want to play. Other players can request to join.</Text>
          </LinearGradient>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Wrapper */}
          <View style={styles.formCard}>
            {/* Title */}
            <Field label="Match Title" error={errors.title}>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === "title" && styles.inputWrapActive,
                  errors.title && styles.inputWrapError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Saturday Evening Doubles"
                  placeholderTextColor={Colors.textTertiary}
                  value={title}
                  onFocus={() => setFocusedField("title")}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => {
                    setTitle(t);
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  maxLength={100}
                />
              </View>
            </Field>

            {/* Match Type */}
            <Field label="Match Type">
              <View style={styles.toggleRow}>
                {["SINGLES", "DOUBLES"].map((type) => {
                  const isActive = matchType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                      onPress={() => setMatchType(type)}
                      activeOpacity={0.8}
                    >
                      {isActive ? (
                        <LinearGradient
                          colors={type === "SINGLES" ? Colors.accentGreen : Colors.accentPurple}
                          style={styles.toggleGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={[styles.toggleBtnText, { color: Colors.textInverse }]}>
                            {type}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.toggleBtnText}>{type}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            {/* Date and Time */}
            <Field label="Scheduled Date & Time" error={errors.scheduledAt}>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  focusedField === "date" && styles.inputWrapActive,
                  errors.scheduledAt && styles.inputWrapError,
                ]}
                onPress={() => {
                  setFocusedField("date");
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
                <Text style={selectedDate ? styles.pickerText : styles.pickerTextPlaceholder}>
                  {selectedDate
                    ? selectedDate.toLocaleString([], {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Select Date and Time"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </Field>

            {/* ELO Range */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ELO Range</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <View
                    style={[
                      styles.inputWrap,
                      focusedField === "eloMin" && styles.inputWrapActive,
                      errors.eloMin && styles.inputWrapError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Min (e.g. 800)"
                      placeholderTextColor={Colors.textTertiary}
                      value={eloMin}
                      onFocus={() => setFocusedField("eloMin")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setEloMin(t);
                        setErrors((prev) => ({ ...prev, eloMin: undefined }));
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.eloMin ? <Text style={styles.errorText}>{errors.eloMin}</Text> : null}
                </View>

                <View style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.inputWrap,
                      focusedField === "eloMax" && styles.inputWrapActive,
                      errors.eloMax && styles.inputWrapError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Max (e.g. 1200)"
                      placeholderTextColor={Colors.textTertiary}
                      value={eloMax}
                      onFocus={() => setFocusedField("eloMax")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setEloMax(t);
                        setErrors((prev) => ({ ...prev, eloMax: undefined }));
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.eloMax ? <Text style={styles.errorText}>{errors.eloMax}</Text> : null}
                </View>
              </View>
            </View>

            {/* Location */}
            <Field label="Location (Optional)" error={errors.location}>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === "location" && styles.inputWrapActive,
                  errors.location && styles.inputWrapError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Paste a Google Maps link"
                  placeholderTextColor={Colors.textTertiary}
                  value={location}
                  onFocus={() => setFocusedField("location")}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => {
                    setLocation(t);
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.helpBox}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.helpText}>
                  Paste the link from Google Maps' "Share" button to give other players directions to the court.
                </Text>
              </View>
            </Field>

            {/* Description */}
            <Field label="Description (Optional)">
              <View
                style={[
                  styles.inputWrap,
                  styles.textAreaWrap,
                  focusedField === "desc" && styles.inputWrapActive,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Details about court bookings, skill levels, shuttlecock type..."
                  placeholderTextColor={Colors.textTertiary}
                  value={description}
                  onFocus={() => setFocusedField("desc")}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => setDescription(t)}
                  multiline
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>{description.length}/500</Text>
            </Field>

            {/* Match Slots Info Banner */}
            <View style={styles.infoBox}>
              <Ionicons name="flash-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>
                {matchType === "SINGLES"
                  ? "Singles match: Requires 2 players total."
                  : "Doubles match: Requires 4 players total."}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={submitting ? [Colors.disabled, Colors.disabled] : Colors.accentGreen}
                style={styles.submitBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.submitBtnText}>Publish Match Post</Text>
                    <Ionicons name="rocket-outline" size={20} color={Colors.textInverse} style={{ marginLeft: Spacing.sm }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
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

  // Scroll Content
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Form Card
  formCard: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },

  fieldGroup: {
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
  inputWrapError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.caption,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  row: {
    flexDirection: "row",
  },

  // Toggles
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    height: 52,
    overflow: "hidden",
  },
  toggleBtnActive: {
    borderWidth: 0,
  },
  toggleGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 50,
  },

  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  pickerText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  pickerTextPlaceholder: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
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

  // Submit button
  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
    ...Shadow.md,
  },
  submitBtn: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },

  helpBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm + 4,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: Radius.sm,
    flexDirection: "row",
  },
  helpText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  textAreaWrap: {
    height: 110,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    alignSelf: "flex-end",
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
});
