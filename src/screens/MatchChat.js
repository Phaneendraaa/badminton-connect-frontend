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
import { Ionicons } from "@expo/vector-icons";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getAccessToken } from "../utils/authStorage";
import { Colors, Spacing, Radius, Typography, FontWeight, Shadow } from "../theme/tokens";

const BASE_URL = "http://10.0.2.2:8082";
const PAGE_SIZE = 50;

// Connection states
const STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

export default function MatchChat({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [connStatus, setConnStatus] = useState(STATUS.CONNECTING);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const stompClientRef = useRef(null);
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

        setHasMore(!data.last);
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

  // ── STOMP connection ──

  const connectStomp = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setConnStatus(STATUS.CONNECTING);

    const client = new Client({
      // SockJS transport — works in both Expo Go and bare workflow.
      // For native-only environments, replace with:
      //   webSocketFactory: () => new WebSocket(`ws://${host}/ws/websocket`)
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnStatus(STATUS.CONNECTED);

        client.subscribe(`/topic/match/${matchId}`, (frame) => {
          try {
            const incoming = JSON.parse(frame.body);
            setMessages((prev) => {
              // Remove any optimistic version of this message (same id or same content/sender within 5s)
              const filtered = prev.filter(
                (m) => !(m._optimistic && m.senderId === incoming.senderId && m.content === incoming.content)
              );
              // Avoid true duplicates if we already received via REST
              const alreadyExists = filtered.some((m) => m.id === incoming.id);
              if (alreadyExists) return filtered;
              return [...filtered, { ...incoming, _confirmed: true }];
            });
          } catch (_) {
            // Malformed frame — ignore
          }
        });
      },
      onStompError: () => {
        setConnStatus(STATUS.ERROR);
      },
      onDisconnect: () => {
        setConnStatus(STATUS.DISCONNECTED);
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [matchId]);

  useEffect(() => {
    connectStomp();
    return () => {
      stompClientRef.current?.deactivate();
    };
  }, [connectStomp]);

  // ── Send message ──

  const sendMessage = () => {
    const content = inputText.trim();
    if (!content || connStatus !== STATUS.CONNECTED) return;

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

    // Send via STOMP
    try {
      stompClientRef.current?.publish({
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

    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && (
          <Text style={styles.bubbleSender}>{item.senderName || "Unknown"}</Text>
        )}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
        <View style={styles.bubbleMeta}>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
          {item._optimistic && !item._failed && (
            <Ionicons name="time-outline" size={10} color={isMe ? Colors.primaryMuted : Colors.textTertiary} />
          )}
          {item._failed && (
            <Ionicons name="alert-circle-outline" size={10} color={Colors.danger} />
          )}
        </View>
      </View>
    );
  };

  const connDot = () => {
    if (connStatus === STATUS.CONNECTED) return Colors.success;
    if (connStatus === STATUS.CONNECTING) return Colors.warning;
    return Colors.danger;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Match Chat</Text>
            <View style={styles.connRow}>
              <View style={[styles.connDot, { backgroundColor: connDot() }]} />
              <Text style={styles.connLabel}>
                {connStatus === STATUS.CONNECTED
                  ? "Connected"
                  : connStatus === STATUS.CONNECTING
                  ? "Connecting…"
                  : "Disconnected"}
              </Text>
            </View>
          </View>
          <View style={{ width: 30 }} />
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
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchHistory(0)}>
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
                <Text style={styles.emptySubtitle}>Be the first to say something!</Text>
              </View>
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Input bar */}
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
            style={[
              styles.sendBtn,
              (!inputText.trim() || connStatus !== STATUS.CONNECTED) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || connStatus !== STATUS.CONNECTED}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                !inputText.trim() || connStatus !== STATUS.CONNECTED
                  ? Colors.textTertiary
                  : Colors.textInverse
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },

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
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: Typography.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  connRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  connDot: { width: 7, height: 7, borderRadius: 4 },
  connLabel: { fontSize: Typography.label, color: Colors.textSecondary },

  // Messages
  messageList: { padding: Spacing.lg, paddingBottom: Spacing.md },
  messageListEmpty: { flex: 1 },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: Typography.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.body, color: Colors.textSecondary },

  // Bubbles
  bubble: {
    maxWidth: "80%",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: Radius.sm,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: Radius.sm,
    ...Shadow.sm,
  },
  bubbleSender: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bubbleText: { fontSize: Typography.body, color: Colors.textPrimary },
  bubbleTextMe: { color: Colors.textInverse },
  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, justifyContent: "flex-end" },
  bubbleTime: { fontSize: Typography.label, color: Colors.textSecondary },
  bubbleTimeMe: { color: Colors.primaryMuted },

  // Input bar
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
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  loadingText: { color: Colors.textSecondary, fontSize: Typography.body },
  errorText: { color: Colors.danger, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  retryText: { color: Colors.textInverse, fontWeight: FontWeight.semiBold },
});
