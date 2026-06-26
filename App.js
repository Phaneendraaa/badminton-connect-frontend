import React, { useState } from "react";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import AuthProvider, { useAuth } from "./src/context/AuthContext";
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

import { Colors, Radius, Shadow } from "./src/theme/tokens";

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
    </Stack.Navigator>
  );
}

// ── Profile Stack ────────────────────────────────────────────────────────────
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="MatchHistory" component={MatchHistory} />
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
  const navigation = useNavigation();
  // We need navigation from the Tab navigator to push screens globally.
  // We use a ref-based approach: each action navigates into the relevant tab stack.

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
          options={{
            tabBarLabel: "Create",
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Don't navigate — just show sheet
              setShowChoiceSheet(true);
            },
          }}
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
          navigation.navigate("HomeTab", { screen: "CreatePost" });
        }}
        onChallengeFriend={() => {
          setShowChoiceSheet(false);
          navigation.navigate("HomeTab", { screen: "Challenge-Match" });
        }}
      />
    </>
  );
}

// ── Root Navigator ───────────────────────────────────────────────────────────
function RootNavigator() {
  const { user } = useAuth();

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
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
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