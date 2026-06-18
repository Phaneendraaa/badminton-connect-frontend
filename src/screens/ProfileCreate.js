import React, { useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ProfileCreate() {
  const navigation = useNavigation();
  const {user,setUser,logout,isNewUser,setIsNewUser} = useAuth();


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [genderEnum, setGenderEnum] = useState("MALE");

  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [uploading, setUploading] = useState(false);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const pickAndUploadImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access."
        );
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

      Alert.alert(
        "Success",
        "Profile image uploaded successfully"
      );
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Upload Failed",
        error?.response?.data?.error?.message ||
          error.message
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim()
      // || !profilePictureUrl   remove in production
    ) {
      Alert.alert(
        "Validation",
        "Please complete all fields"
      );
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
        }),
      });

      if (response.ok) {
        setIsNewUser(false);
        Alert.alert("Success", "Profile created");
        navigation.navigate("Home");
      } else {
        const errorData = await response
          .json()
          .catch(() => ({}));

        Alert.alert(
          "Error",
          errorData.message || "Server error"
        );
      }
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        error.message || "Network error"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Profile</Text>

      <TouchableOpacity
        style={styles.imageContainer}
        onPress={pickAndUploadImage}
      >
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            style={styles.image}
          />
        ) : (
          <Text>Select Profile Picture</Text>
        )}
      </TouchableOpacity>

      {uploading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
          <Text>Uploading...</Text>
        </View>
      )}

      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{formatDate(dob)}</Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={dob}
          mode="date"
          maximumDate={new Date()}
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);

            if (selectedDate) {
              setDob(selectedDate);
            }
          }}
        />
      )}
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            genderEnum === "MALE" &&
              styles.genderSelected,
          ]}
          onPress={() => setGenderEnum("MALE")}
        >
          <Text>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            genderEnum === "FEMALE" &&
              styles.genderSelected,
          ]}
          onPress={() => setGenderEnum("FEMALE")}
        >
          <Text>Female</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            genderEnum === "OTHER" &&
              styles.genderSelected,
          ]}
          onPress={() => setGenderEnum("OTHER")}
        >
          <Text>Other</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>
          Create Profile
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loaderContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: "center",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  genderSelected: {
    backgroundColor: "#dbeafe",
  },
  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});