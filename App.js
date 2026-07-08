import React, { useState, useRef, useEffect } from "react";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";

import AuthProvider, { useAuth } from "./src/context/AuthContext";
import { StompProvider, useStomp } from "./src/context/StompContext";
import Home from "./src/screens/Home";
import Otp from "./src/screens/Otp";
import Login from "./src/screens/Login";
import ProfileCreate from "./src/screens/ProfileCreate";
import ChallengeMatch from "./src/screens/ChallengeMatch";
import ChallengeRoom from "./src/screens/ChallengeRoom";
import Activity from "./src/screens/Activity";
import Profile from "./src/screens/Profile";
import MatchPlay from "./src/screens/MatchPlay";
import MatchHistory from "./src/screens/MatchHistory";
import MatchFeed from "./src/screens/MatchFeed";
import CreatePost from "./src/screens/CreatePost";
import PostDetail from "./src/screens/PostDetail";
import MatchChat from "./src/screens/MatchChat";
import ChoiceSheet from "./src/screens/ChoiceSheet";
import Tournament from "./src/screens/Tournament";
import TeamFormation from "./src/screens/TeamFormation";
import PostInquiry from "./src/screens/PostInquiry";
import SearchPlayers from "./src/screens/SearchPlayers";

import { Colors, Radius, Shadow } from "./src/theme/tokens";

// ── Notification handler (foreground display) ────────────────────────────
// Must be set before the navigator mounts so it catches notifications that
// arrive while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// Shared navigation ref — lets the notification tap handler navigate
// without needing to be inside a React component tree.
const navigationRef = React.createRef();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import Notifications from "./src/screens/Notifications";
import Messages from "./src/screens/Messages";

import PublicProfile from "./src/screens/PublicProfile";

// ── Home Stack ──────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
      <Stack.Screen name="MatchFeed" component={MatchFeed} />
      <Stack.Screen name="PostDetail" component={PostDetail} />
      <Stack.Screen name="MatchChat" component={MatchChat} />
      <Stack.Screen name="CreatePost" component={CreatePost} />
      <Stack.Screen name="Challenge-Match" component={ChallengeMatch} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Messages" component={Messages} />
      <Stack.Screen name="PublicProfile" component={PublicProfile} />
      <Stack.Screen name="TeamFormation" component={TeamFormation} />
      <Stack.Screen name="PostInquiry" component={PostInquiry} />
      <Stack.Screen name="SearchPlayers" component={SearchPlayers} />
    </Stack.Navigator>
  );
}

// ── Activity Stack ───────────────────────────────────────────────────────────
function ActivityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivityMain" component={Activity} />
      <Stack.Screen name="PostDetail" component={PostDetail} />
      <Stack.Screen name="Challenge-Room" component={ChallengeRoom} />
      <Stack.Screen name="MatchPlay" component={MatchPlay} />
      <Stack.Screen name="MatchHistory" component={MatchHistory} />
      <Stack.Screen name="MatchChat" component={MatchChat} />
      <Stack.Screen name="CreatePost" component={CreatePost} />
      <Stack.Screen name="Challenge-Match" component={ChallengeMatch} />
      <Stack.Screen name="PublicProfile" component={PublicProfile} />
      <Stack.Screen name="TeamFormation" component={TeamFormation} />
      <Stack.Screen name="PostInquiry" component={PostInquiry} />
    </Stack.Navigator>
  );
}

// ── Profile Stack ────────────────────────────────────────────────────────────
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="MatchHistory" component={MatchHistory} />
      <Stack.Screen name="PublicProfile" component={PublicProfile} />
      <Stack.Screen name="SearchPlayers" component={SearchPlayers} />
    </Stack.Navigator>
  );
}

// ── Tournament Stack ────────────────────────────────────────────────────────
function TournamentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TournamentMain" component={Tournament} />
    </Stack.Navigator>
  );
}



// ── Main Tab Navigator (authenticated) ───────────────────────────────────────
function MainTabs() {
  const [showChoiceSheet, setShowChoiceSheet] = useState(false);
  // tabNavRef captures the Tab navigator's navigation object from listeners.
  // useNavigation() here gives the parent Stack's navigation which does NOT
  // know about "HomeTab" — we must use the Tab navigator's own nav instead.
  const tabNavRef = React.useRef(null);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "HomeTab") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "ActivityTab") {
              iconName = focused ? "layers" : "layers-outline";
            } else if (route.name === "PlusTab") {
              return (
                <LinearGradient
                  colors={Colors.accentGreen}
                  style={styles.plusBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add" size={18} color={Colors.textInverse} />
                </LinearGradient>
              );
            } else if (route.name === "TournamentTab") {
              iconName = focused ? "trophy" : "trophy-outline";
            } else if (route.name === "ProfileTab") {
              iconName = focused ? "person" : "person-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ tabBarLabel: "Home" }}
        />
        <Tab.Screen
          name="ActivityTab"
          component={ActivityStack}
          options={{ tabBarLabel: "Activity" }}
        />
        <Tab.Screen
          name="PlusTab"
          component={HomeStack}
          options={{ tabBarLabel: "Create" }}
          listeners={({ navigation: tabNav }) => ({
            tabPress: (e) => {
              e.preventDefault(); // Don't navigate — just show sheet
              tabNavRef.current = tabNav; // capture Tab navigator's navigation
              setShowChoiceSheet(true);
            },
          })}
        />
        <Tab.Screen
          name="TournamentTab"
          component={TournamentStack}
          options={{ tabBarLabel: "Tournaments" }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{ tabBarLabel: "Profile" }}
        />
      </Tab.Navigator>

      {/* Choice sheet is rendered outside Tab.Navigator so it overlays all tabs */}
      <ChoiceSheet
        visible={showChoiceSheet}
        onClose={() => setShowChoiceSheet(false)}
        onPostOpen={() => {
          setShowChoiceSheet(false);
          // Use the Tab navigator's navigation — it knows about "HomeTab"
          tabNavRef.current?.navigate("HomeTab", { screen: "CreatePost" });
        }}
        onChallengeFriend={() => {
          setShowChoiceSheet(false);
          tabNavRef.current?.navigate("HomeTab", { screen: "Challenge-Match" });
        }}
      />
    </>
  );
}

// ── Root Navigator ───────────────────────────────────────────────────────────
function RootNavigator() {
  const { user, setUnreadCount } = useAuth();
  const { subscribe } = useStomp();

  // Subscribe to the per-user notifications topic so the badge updates live
  // the instant any notification is created or marked read, anywhere in the app.
  useEffect(() => {
    if (!user?.userId) return;
    const topic = `/topic/user/${user.userId}/notifications`;
    const unsub = subscribe(topic, (data) => {
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    });
    return () => unsub();
  }, [user?.userId, subscribe, setUnreadCount]);

  if (user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        {/* Screens accessible from any tab via navigation.navigate() */}
        <Stack.Screen name="Profile-create" component={ProfileCreate} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Otp" component={Otp} options={{ title: "Verify OTP" }} />
    </Stack.Navigator>
  );
}

export default function App() {
  // Wire up notification tap → deep-link handler.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data || {};
        const nav  = navigationRef.current;
        if (!nav) return;

        const type    = data.type;
        const postId  = data.postId;
        const matchId = data.matchId;

        if (
          type === "JOIN_REQUEST_RECEIVED" ||
          type === "JOIN_REQUEST_ACCEPTED" ||
          type === "JOIN_REQUEST_REJECTED" ||
          type === "POST_FULL" ||
          type === "POST_CANCELLED"
        ) {
          if (postId) nav.navigate("HomeTab", { screen: "PostDetail", params: { postId } });
        } else if (type === "NEW_CHAT_MESSAGE") {
          if (matchId) nav.navigate("HomeTab", { screen: "MatchChat", params: { matchId } });
        } else if (type === "MATCH_STARTING_SOON") {
          if (matchId) nav.navigate("ActivityTab", { screen: "MatchPlay", params: { matchId } });
        }
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <AppWithStomp />
    </AuthProvider>
  );
}

/**
 * Separate component so we can call useAuth() inside AuthProvider
 * and pass userId into StompProvider.
 */
function AppWithStomp() {
  const { user } = useAuth();
  const userId = user?.userId || user?.id;

  return (
    <StompProvider userId={userId}>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </StompProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 4,
    ...Shadow.md,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  plusTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  plusBtnInner: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.glow,
  },
  plusTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginTop: 4,
  },
});