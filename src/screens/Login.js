import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import api from "../utils/api.js"
import { useAuth } from "../context/AuthContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

export default function Login({ navigation }) {
  const { setPhoneNumber } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneRegex.test(phone)) {
      Alert.alert("Invalid Number", "Please enter a valid 10 digit Indian mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: "+91" + phone,
        }),
      });
      
      if (response.ok) {
        setPhoneNumber("+91" + phone);
        navigation.navigate("Otp");
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Please Signup or check your number");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error or server is down",error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    // Allow only digits and max 10 characters
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.countryCode}>+91</Text>

        <TextInput
          value={phone}
          onChangeText={handleChange}
          placeholder="Enter Mobile Number"
          keyboardType="number-pad"
          maxLength={10}
          style={styles.input}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 18,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    height: 55,
    justifyContent: "center"
  },
  buttonDisabled: {
    backgroundColor: "#8ebbf0",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});