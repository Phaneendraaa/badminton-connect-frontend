import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthProvider, { useAuth } from "./src/context/AuthContext";
import Home from "./src/screens/Home";
import Otp from "./src/screens/Otp";
import Login from "./src/screens/Login";
import ProfileCreate from "./src/screens/ProfileCreate";
import ChallengeMatch from "./src/screens/ChallengeMatch";
import ChallengeRoom from "./src/screens/ChallengeRoom";
const Stack = createNativeStackNavigator();

// separate component so useAuth works inside NavigationContainer
function RootNavigator() {
  const { user, isNewUser } = useAuth();
 
  return (
    <Stack.Navigator>
      {user ? (
        <>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile-create"
          component={ProfileCreate}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Challenge-Match"
          component={ChallengeMatch}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Challenge-Room"
          component={ChallengeRoom}
          options={{ headerShown: false }}
        />
        </>
        
        
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Otp"
            component={Otp}
            options={{ title: "Verify OTP" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />{/* ✅ useAuth works here because AuthProvider is above */}
      </NavigationContainer>
    </AuthProvider>
  );
}