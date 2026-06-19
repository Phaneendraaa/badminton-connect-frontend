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
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function Login({ navigation }) {
  const { setPhoneNumber } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleLogin = async () => {
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneRegex.test(phone)) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit Indian mobile number");
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
      Alert.alert("Error", "Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#111827"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardContainer}>
        {/* Logo & Header Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBg}>
            <Ionicons name="flash" size={44} color="#00F5A0" />
          </View>
          <Text style={styles.logoText}>
            Badminton<Text style={styles.logoAccent}>Connect</Text>
          </Text>
          <Text style={styles.tagline}>Match up, play, and level up your ELO.</Text>
        </View>

        {/* Form Card (Frosted Glass Effect) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Enter your mobile number to sign in or create an account</Text>

          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerActive,
            ]}
          >
            <Text style={styles.countryCode}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              value={phone}
              onChangeText={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter Mobile Number"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleLogin}
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
                  <Text style={styles.buttonText}>Get Verification Code</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Secured by Twilio OTP Verification
        </Text>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(0, 245, 160, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(0, 245, 160, 0.25)",
    ...Shadow.glow,
  },
  logoText: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  logoAccent: {
    color: "#00D9F5",
  },
  tagline: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    height: 58,
  },
  inputContainerActive: {
    borderColor: Colors.primary,
  },
  countryCode: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  buttonWrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
    marginTop: Spacing.sm,
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
  footerText: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontSize: Typography.caption,
    marginTop: Spacing.xl,
  },
});