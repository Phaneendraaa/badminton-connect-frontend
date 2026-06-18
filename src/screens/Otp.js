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
import { useAuth } from "../context/AuthContext";
import api from "../utils/api.js"

export default function Otp({navigation}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { phoneNumber, login } = useAuth();

  const handleSubmit = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api("/auth/login/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          otp: otp
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // data contains accessToken, refreshToken, userId
        await login(data.accessToken, data.refreshToken, {
          userId: data.userId
        },data.newUser);  
        console.log(JSON.stringify(data));
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Invalid or expired OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>Sent to {phoneNumber}</Text>

      <TextInput
        value={otp}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
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
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    height: 60,
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 10,
    marginBottom: 30,
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