import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api.js";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function Otp({ navigation }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
        await login(data.accessToken, data.refreshToken, {
          userId: data.userId
        }, data.newUser);  
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
    <LinearGradient
      colors={[Colors.background, "#111827"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardContainer}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Icon Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconBg}>
            <Ionicons name="lock-closed" size={44} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            Verification code sent to{"\n"}
            <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
          <TextInput
            value={otp}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType="phone-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={Colors.textTertiary}
            style={[
              styles.input,
              isFocused && styles.inputActive,
            ]}
            accessibilityLabel="OTP Input"
          />

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? [Colors.disabled, Colors.disabled] : Colors.accentGreen}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Verify & Proceed</Text>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => Alert.alert("Resend OTP", "OTP code request has been re-sent!")}
            disabled={loading}
          >
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: 60,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.25)",
    ...Shadow.glowPurple,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  phoneHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
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
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 64,
    textAlign: "center",
    fontSize: 32,
    fontWeight: FontWeight.bold,
    letterSpacing: 8,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputActive: {
    borderColor: Colors.primary,
  },
  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  button: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.sm,
  },
  resendBtn: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  resendText: {
    color: "#00D9F5",
    fontSize: Typography.bodySmall,
    fontWeight: FontWeight.medium,
  },
});