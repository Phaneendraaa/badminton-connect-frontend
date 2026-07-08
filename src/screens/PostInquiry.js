import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

/**
 * PostInquiry — Pre-join inquiry thread for an open post.
 *
 * Allows potential joiners and the organizer to communicate before the match
 * roster is finalised. Separate from the in-match MatchChat.
 *
 * Route params: { postId, postTitle? }
 */
export default function PostInquiry({ route, navigation }) {
  const { postId, postTitle } = route.params || {};
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");

  const flatListRef = useRef(null);
  const currentUserId = user?.userId || user?.id;

  const fetchThread = useCallback(async () => {
    try {
      const res = await api(`/post-inquiry/${postId}/thread`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (e) {
      console.error("PostInquiry fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchThread();
      // Poll every 10 seconds while on screen
      const interval = setInterval(() => fetchThread(), 10_000);
      return () => clearInterval(interval);
    }, [fetchThread])
  );

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await api(`/post-inquiry/${postId}/send`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send message");
      setInputText("");
      await fetchThread();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = String(item.senderId) === String(currentUserId);
    const time = item.sentAt
      ? new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <LinearGradient
            colors={Colors.accentPurple}
            style={styles.avatarBubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{(item.senderName || "?")[0].toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.msgTime}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {postTitle || "Post Inquiry"}
          </Text>
          <Text style={styles.headerSub}>Ask the organizer a question</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Start the conversation! Ask the organizer about the match details.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending || !inputText.trim()}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <LinearGradient colors={Colors.accentGreen} style={styles.sendGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="send" size={18} color={Colors.textInverse} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: Colors.border,
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: Spacing.sm },
  headerTitle: { fontSize: Typography.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 1 },

  list: { padding: Spacing.lg, paddingBottom: Spacing.md },

  // Messages
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: Spacing.md },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  avatarBubble: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.sm,
  },
  avatarText: { color: "#FFF", fontWeight: FontWeight.bold, fontSize: Typography.caption },
  bubble: {
    maxWidth: "75%", borderRadius: Radius.lg, padding: Spacing.md,
  },
  bubbleMe: {
    backgroundColor: "rgba(0, 245, 160, 0.18)",
    borderWidth: 1, borderColor: "rgba(0, 245, 160, 0.25)",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: Typography.caption, fontWeight: FontWeight.bold,
    color: Colors.primary, marginBottom: 4,
  },
  msgText: { fontSize: Typography.body, color: Colors.textPrimary, lineHeight: 20 },
  msgTime: {
    fontSize: 10, color: Colors.textTertiary, marginTop: 4, alignSelf: "flex-end",
  },

  // Empty
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  emptyTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySub: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm },

  // Input
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  inputWrap: {
    flex: 1, backgroundColor: "rgba(9,13,26,0.6)",
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 46,
  },
  textInput: { fontSize: Typography.body, color: Colors.textPrimary, maxHeight: 120 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, overflow: "hidden" },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
});
