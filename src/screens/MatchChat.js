import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useStomp } from "../context/StompContext";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const PAGE_SIZE = 50;

export default function MatchChat({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();
  const { subscribe, isConnected, clientRef } = useStomp();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef(null);
  const currentUserId = user?.userId || user?.id;

  // ── Fetch history ──

  const fetchHistory = useCallback(
    async (pageNum = 0, prepend = false) => {
      if (pageNum === 0) setLoadingHistory(true);
      else setLoadingMore(true);
      setHistoryError(null);

      try {
        const res = await api(
          `/match-chat/${matchId}/messages?page=${pageNum}&size=${PAGE_SIZE}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || "Failed to load chat history");

        const items = (data.content || []).map((m) => ({ ...m, _confirmed: true }));

        if (prepend) {
          setMessages((prev) => [...items, ...prev]);
        } else {
          setMessages(items);
        }

        const pageInfo = data.page || {};
        const isLast = data.last !== undefined
          ? data.last
          : (pageInfo.totalPages !== undefined && pageInfo.number !== undefined
              ? pageInfo.number >= pageInfo.totalPages - 1
              : true);

        setHasMore(!isLast);
        setPage(pageNum);
      } catch (err) {
        setHistoryError(err.message || "Failed to load messages");
      } finally {
        setLoadingHistory(false);
        setLoadingMore(false);
      }
    },
    [matchId]
  );

  useEffect(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  // ── STOMP subscription (shared connection from StompContext) ────────────────
  // Subscribe to the match chat topic using the shared app-level connection.
  // Incoming messages from other players appear in real time.
  useEffect(() => {
    const unsub = subscribe(`/topic/match/${matchId}`, (incoming) => {
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m._optimistic && m.senderId === incoming.senderId && m.content === incoming.content)
        );
        const alreadyExists = filtered.some((m) => m.id === incoming.id);
        if (alreadyExists) return filtered;
        return [...filtered, { ...incoming, _confirmed: true }];
      });
    });
    return () => unsub();
  }, [matchId, subscribe]);

  // ── Send message ──

  const sendMessage = () => {
    const content = inputText.trim();
    if (!content || !isConnected) return;

    // Optimistic send — show immediately
    const optimisticId = `opt_${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      matchId,
      senderId: currentUserId,
      senderName: user?.name || "You",
      content,
      sentAt: new Date().toISOString(),
      _optimistic: true,
      _confirmed: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");

    // Send via shared STOMP client
    try {
      clientRef.current?.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ matchId, content }),
      });
    } catch (_) {
      // Mark as failed if STOMP publish throws
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, _failed: true } : m
        )
      );
    }
  };

  // ── Load more (scroll to top) ──

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || loadingHistory) return;
    fetchHistory(page + 1, true);
  };

  // ── Render ──

  const renderMessage = ({ item }) => {
    const isMe = String(item.senderId) === String(currentUserId);
    const time = item.sentAt
      ? new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    if (isMe) {
      return (
        <View style={styles.meBubbleWrapper}>
          <LinearGradient
            colors={Colors.accentPurple}
            style={styles.bubbleMe}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.bubbleTextMe}>{item.content}</Text>
            <View style={styles.bubbleMeta}>
              <Text style={styles.bubbleTimeMe}>{time}</Text>
              {item._optimistic && !item._failed && (
                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.6)" style={{ marginLeft: 2 }} />
              )}
              {item._failed && (
                <Ionicons name="alert-circle-outline" size={10} color={Colors.danger} style={{ marginLeft: 2 }} />
              )}
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.themBubbleWrapper}>
        <View style={styles.bubbleThem}>
          <Text style={styles.bubbleSender}>{item.senderName || "Player"}</Text>
          <Text style={styles.bubbleTextThem}>{item.content}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTimeThem}>{time}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getConnColor = () => isConnected ? Colors.primary : Colors.warning;
  const getConnGlow  = () => isConnected ? styles.glowGreen : styles.glowOrange;

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Match Chat</Text>
            <View style={styles.connRow}>
              <View style={[styles.connDot, { backgroundColor: getConnColor() }, getConnGlow()]} />
              <Text style={styles.connLabel}>
                {isConnected ? "Connected" : "Connecting…"}
              </Text>
            </View>
          </View>
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
            <Text style={styles.statsText}>Chat with the other players in this match.</Text>
          </LinearGradient>
        </View>

        {/* Messages list */}
        {loadingHistory ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading messages…</Text>
          </View>
        ) : historyError ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.danger} />
            <Text style={styles.errorText}>{historyError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchHistory(0)} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && styles.messageListEmpty,
            ]}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to send a message!</Text>
              </View>
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Input bar (frosted glass footer) */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={styles.sendBtnWrapper}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(!inputText.trim() || !isConnected) ? [Colors.disabled, Colors.disabled] : Colors.accentGreen}
              style={styles.sendBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="send"
                size={18}
                color={
                  !inputText.trim() || !isConnected
                    ? Colors.textTertiary
                    : Colors.textInverse
                }
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  connRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  glowGreen: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  glowOrange: {
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  glowRed: {
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  connLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
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

  // Messages List
  messageList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  messageListEmpty: {
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },

  // Bubbles
  meBubbleWrapper: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    marginBottom: Spacing.sm,
  },
  bubbleMe: {
    borderRadius: Radius.lg,
    borderBottomRightRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Shadow.glowPurple,
  },
  themBubbleWrapper: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    marginBottom: Spacing.sm,
  },
  bubbleThem: {
    backgroundColor: "rgba(30, 38, 64, 0.4)",
    borderRadius: Radius.lg,
    borderBottomLeftRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  bubbleSender: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  bubbleTextMe: {
    fontSize: Typography.body,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  bubbleTextThem: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    justifyContent: "flex-end",
  },
  bubbleTimeMe: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  bubbleTimeThem: {
    fontSize: 10,
    color: Colors.textTertiary,
  },

  // Input Bar (frosted glass)
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtnWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.glow,
  },
  sendBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  errorText: {
    color: Colors.danger,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  retryText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
});
