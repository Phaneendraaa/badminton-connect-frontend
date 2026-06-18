import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import api from "../utils/api";

export default function ChallengeRoom({ route }) {
  const { matchId } = route.params;
  
  const [mobile, setMobile] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
//   useEffect(
//     ()=>{
//         console.log(matchId);
//     }
//   )
  const searchUser = async () => {
    if (!mobile.trim()) {
      Alert.alert("Error", "Please enter a mobile number");
      return;
    }

    try {
      setSearching(true);

      const response = await api("/user/search", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: "+91"+mobile,
        }),
      });
    
      const user = await response.json();
      console.log("User searched found ->",user);
      setSearchedUser(user);
    } catch (error) {
      console.log(error);
      setSearchedUser(null);

      Alert.alert(
        "Not Found",
        "No user found with this mobile number",
        error
      );
    } finally {
      setSearching(false);
    }
  };

  const sendInvite = async () => {
    try {
      setSendingInvite(true);

      const response = await api("/challenge-friend/invite", {
        method: "POST",
        body: JSON.stringify({
          matchId,
          phoneNumber: searchedUser.phoneNumber,
        }),
      });

  Alert.alert("Success", data.message);

} catch (error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 409) {
        Alert.alert('Already Exists', data.message);
        return;
      }

      // handle other status codes (400, 500, etc.)
      Alert.alert('Error', data.message || 'Something went wrong');
    }
}
    finally {
      setSendingInvite(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Challenge Room</Text>

      <View style={styles.roomCard}>
        <Text style={styles.roomLabel}>Room ID</Text>
        <Text style={styles.roomId}>{matchId}</Text>
      </View>

      <Text style={styles.sectionTitle}>
        Invite Player
      </Text>

      <TextInput
        placeholder="Enter mobile number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchUser}
        disabled={searching}
      >
        {searching ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Search Player
          </Text>
        )}
      </TouchableOpacity>

      {searchedUser && (
        <View style={styles.userCard}>
          <Image
            source={{
              uri:
                searchedUser.profilePictureUrl ||
                "https://via.placeholder.com/150",
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>
            {searchedUser.name}
          </Text>

          <Text style={styles.mobile}>
            {searchedUser.mobileNumber}
          </Text>

          <TouchableOpacity
            style={styles.inviteButton}
            onPress={sendInvite}
            disabled={sendingInvite}
          >
            {sendingInvite ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Add To Room
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  roomCard: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },

  roomLabel: {
    fontSize: 12,
    color: "#666",
  },

  roomId: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },

  searchButton: {
    height: 50,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  userCard: {
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
  },

  mobile: {
    color: "#666",
    marginTop: 5,
    marginBottom: 20,
  },

  inviteButton: {
    backgroundColor: "#22c55e",
    height: 50,
    paddingHorizontal: 25,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});