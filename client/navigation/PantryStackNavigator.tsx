import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PantryScreen from "@/screens/PantryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PantryStackParamList = {
  PantryMain: undefined;
};

const Stack = createNativeStackNavigator<PantryStackParamList>();

export default function PantryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PantryMain"
        component={PantryScreen}
        options={{
          headerTitle: "Pantry",
        }}
      />
    </Stack.Navigator>
  );
}
