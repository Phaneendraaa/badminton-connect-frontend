import { View, Text,TextInput, FlatList, Pressable } from "react-native";
import {useEffect, useState} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext.js";

export default function Home({navigation}) {
    const {user,setUser,logout,isNewUser} = useAuth();
    const handleLogout = ()=>{
        logout();
    }
    const handleChallenge=()=>{
        navigation.navigate("Challenge-Match");
    }
    const handleRequests=()=>{
        navigation.navigate("Requests");
    }
    const handleMatchHistory=()=>{
        navigation.navigate("MatchHistory");
    }
    useEffect(
        ()=>{
            if(isNewUser){
                navigation.navigate("Profile-create");
            }
        },[]
    )
  return (
    <SafeAreaView>
        <Text>This is Home </Text>
        <Pressable onPress={logout} >
            <Text>Logout</Text>
        </Pressable>
        <Pressable onPress={handleChallenge} >
            <Text>CHallenge a friend</Text>
        </Pressable>
        <Pressable onPress={handleRequests} style={{marginTop: 10}}>
            <Text>Requests & Rooms</Text>
        </Pressable>
        <Pressable onPress={handleMatchHistory} style={{marginTop: 10}}>
            <Text>My Matches</Text>
        </Pressable>
    </SafeAreaView>
  );
}
