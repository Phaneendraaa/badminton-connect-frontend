import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

export default function Profile() {
  const { logout, user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch Data
  const fetchProfileAndStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [profileRes, statsRes] = await Promise.all([
        api("/profile/me"),
        api("/profile/stats"),
      ]);

      if (profileRes.ok && statsRes.ok) {
        const pData = await profileRes.json();
        const sData = await statsRes.json();
        setProfile(pData);
        setStats(sData);
      } else {
        throw new Error("Failed to load profile data");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const openEditModal = () => {
    if (profile) {
      setEditFirstName(profile.firstName || "");
      setEditLastName(profile.lastName || "");
      setEditCity(profile.homeCity || "");
      setEditAvatarUrl(profile.profilePictureUrl || "");
      setEditModalVisible(true);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access to upload a picture.");
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
      setSaving(true);
      
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
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setEditAvatarUrl(response.data.secure_url);
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await api("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          homeCity: editCity.trim(),
          profilePictureUrl: editAvatarUrl,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditModalVisible(false);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={[Colors.background, "#111827"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfileAndStats(true)} tintColor={Colors.primary} />}
        >
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <TouchableOpacity style={styles.iconBtn} onPress={openEditModal}>
                <Ionicons name="pencil" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {profile?.profilePictureUrl ? (
                <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.firstName?.[0] || "?").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.nameText}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            
            <View style={styles.tagWrap}>
              <View style={styles.tag}>
                <Ionicons name="location" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>{profile?.homeCity || "No City Set"}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="male-female" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>{profile?.genderEnum}</Text>
              </View>
            </View>
          </View>

          {/* Glowing Badges Grid */}
          <Text style={styles.sectionTitle}>PLAYER STATS</Text>
          <View style={styles.statsGrid}>
            
            {/* ELO Rating Badge */}
            <View style={[styles.statBoxBorder, { borderColor: 'rgba(0, 245, 160, 0.3)' }]}>
              <LinearGradient colors={['rgba(0, 245, 160, 0.15)', 'rgba(0, 245, 160, 0.05)']} style={styles.statBoxInner}>
                <Ionicons name="trophy-outline" size={28} color={Colors.accentGreen[0]} />
                <Text style={styles.statValue}>{user?.elo || 1200}</Text>
                <Text style={styles.statLabel}>Current ELO</Text>
              </LinearGradient>
            </View>

            {/* Trust Score Badge */}
            <View style={[styles.statBoxBorder, { borderColor: 'rgba(0, 217, 245, 0.3)' }]}>
              <LinearGradient colors={['rgba(0, 217, 245, 0.15)', 'rgba(0, 217, 245, 0.05)']} style={styles.statBoxInner}>
                <Ionicons name="shield-checkmark-outline" size={28} color={Colors.primary} />
                <Text style={styles.statValue}>{stats?.trustScore || 0}%</Text>
                <Text style={styles.statLabel}>Trust Score</Text>
              </LinearGradient>
            </View>

            {/* Win Rate Badge */}
            <View style={[styles.statBoxBorder, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
              <LinearGradient colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']} style={styles.statBoxInner}>
                <Ionicons name="flame-outline" size={28} color={Colors.accentPurple[0]} />
                <Text style={styles.statValue}>{stats?.winRate || 0}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </LinearGradient>
            </View>

            {/* Matches Played Badge */}
            <View style={[styles.statBoxBorder, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <LinearGradient colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']} style={styles.statBoxInner}>
                <Ionicons name="tennisball-outline" size={28} color={Colors.accentOrange[0]} />
                <Text style={styles.statValue}>{stats?.matchesPlayed || 0}</Text>
                <Text style={styles.statLabel}>Matches Played</Text>
              </LinearGradient>
            </View>
            
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.editAvatarWrap} onPress={handlePickImage} disabled={saving}>
                {editAvatarUrl ? (
                  <Image source={{ uri: editAvatarUrl }} style={styles.editAvatarImg} />
                ) : (
                  <View style={styles.editAvatarPlaceholder}>
                    <Ionicons name="camera" size={32} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.avatarEditOverlay}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} placeholderTextColor={Colors.textTertiary} />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} placeholderTextColor={Colors.textTertiary} />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Home City</Text>
                <TextInput style={styles.input} value={editCity} onChangeText={setEditCity} placeholderTextColor={Colors.textTertiary} placeholder="e.g. London" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                <LinearGradient colors={Colors.accentGreen} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientBg: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Profile Card
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    ...Shadow.glow,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  nameText: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagWrap: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 217, 245, 0.1)",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(0, 217, 245, 0.2)",
  },
  tagText: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
  },

  // Glowing Badges Grid
  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  statBoxBorder: {
    width: "47%",
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadow.glow,
  },
  statBoxInner: {
    padding: Spacing.lg,
    alignItems: "center",
    borderRadius: Radius.lg,
  },
  statValue: {
    fontSize: Typography.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Edit Modal
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  editAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  editAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
  },
  editAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surfaceElevated,
  },
  inputWrap: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.body,
  },
  saveBtn: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  saveBtnGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },
});
