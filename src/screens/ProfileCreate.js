import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";
import CitySearchPicker from "../components/CitySearchPicker";

export default function ProfileCreate() {
  const navigation = useNavigation();
  const { user, setUser, logout, isNewUser, setIsNewUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [genderEnum, setGenderEnum] = useState("MALE");
  const [homeCity, setHomeCity] = useState("");

  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cities, setCities] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Load city list for the picker
  useEffect(() => {
    api("/reference/cities")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setCities(data) : null)
      .catch(() => {});
  }, []);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const pickAndUploadImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access to upload a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: image.mimeType || "image/jpeg",
        name: "profile.jpg",
      });

      formData.append("upload_preset", "profile_upload");
      const cloudName = "ddlpu2odd";

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfilePictureUrl(response.data.secure_url);
      Alert.alert("Success", "Profile image uploaded successfully! 📸");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Upload Failed",
        error?.response?.data?.error?.message || error.message
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation", "Please fill in your first and last name.");
      return;
    }

    try {
      const response = await api("/profile/create", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          profilePictureUrl,
          dateOfBirth: formatDate(dob),
          genderEnum,
          homeCity: homeCity || null,
        }),
      });

      if (response.ok) {
        setIsNewUser(false);
        Alert.alert("Success", "Profile created successfully! Welcome to the court. 🏸");
        navigation.navigate("MainTabs");
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Server error");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Network error");
    }
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#111827"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Profile</Text>
        <Text style={styles.subtitle}>Let other players know who you are</Text>

        {/* Profile Image Uploader */}
        <TouchableOpacity
          style={[styles.imageContainer, profilePictureUrl && styles.imageContainerActive]}
          onPress={pickAndUploadImage}
          disabled={uploading}
        >
          {profilePictureUrl ? (
            <Image source={{ uri: profilePictureUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loaderText}>Uploading Image...</Text>
          </View>
        )}

        {/* Frosted glass form panel */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>First Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="First Name"
              placeholderTextColor={Colors.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />
          </View>

          <Text style={styles.inputLabel}>Last Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Last Name"
              placeholderTextColor={Colors.textTertiary}
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
            />
          </View>

          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.dateText}>{formatDate(dob)}</Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(selectedDate);
                }
              }}
            />
          )}

          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderContainer}>
            {["MALE", "FEMALE", "OTHER"].map((gender) => {
              const isSelected = genderEnum === gender;
              return (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    isSelected && styles.genderSelected,
                  ]}
                  onPress={() => setGenderEnum(gender)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderText,
                      isSelected && styles.genderTextSelected,
                    ]}
                  >
                    {gender.charAt(0) + gender.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Home City */}
          <Text style={styles.inputLabel}>Home City (optional)</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={homeCity ? Colors.primary : Colors.textSecondary}
              style={{ marginRight: Spacing.sm }}
            />
            <Text style={[styles.dateText, homeCity && { color: Colors.primary }]}>
              {homeCity || "Select your city"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.accentGreen}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitText}>Complete Registration</Text>
              <Ionicons name="checkmark" size={20} color={Colors.textInverse} style={{ marginLeft: Spacing.sm }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cancel & Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* City Picker Modal */}
      <CitySearchPicker
        visible={showCityPicker}
        cities={cities}
        selectedCity={homeCity || null}
        onSelect={(city) => {
          setHomeCity(city || "");
          setShowCityPicker(false);
        }}
        onClose={() => setShowCityPicker(false)}
        allowAll={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: FontWeight.bold,
    textAlign: "center",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  imageContainerActive: {
    borderStyle: "solid",
    borderColor: Colors.primary,
    ...Shadow.glow,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginTop: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  loaderText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semiBold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
  },
  dateText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  genderButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  genderSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  genderText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.medium,
  },
  genderTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  submitBtn: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: Colors.textInverse,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  logoutBtn: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.semiBold,
  },
});