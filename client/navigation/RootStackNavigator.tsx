import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WelcomeScreen from "@/screens/WelcomeScreen";
import ScanReceiptScreen from "@/screens/ScanReceiptScreen";
import ConfirmItemsScreen from "@/screens/ConfirmItemsScreen";
import ConsumptionScreen from "@/screens/ConsumptionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/theme";

export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
  ScanReceipt: undefined;
  ConfirmItems: { imageBase64: string };
  Consumption: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { hasCompletedOnboarding, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{
        ...screenOptions,
        contentStyle: { backgroundColor: Colors.light.backgroundRoot },
      }}
      initialRouteName={hasCompletedOnboarding ? "Main" : "Welcome"}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{ 
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="ConfirmItems"
        component={ConfirmItemsScreen}
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Consumption"
        component={ConsumptionScreen}
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
}
