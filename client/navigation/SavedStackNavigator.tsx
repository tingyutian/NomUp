import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SavedRecipesScreen from "@/screens/SavedRecipesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SavedStackParamList = {
  SavedRecipes: undefined;
};

const Stack = createNativeStackNavigator<SavedStackParamList>();

export default function SavedStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="SavedRecipes"
        component={SavedRecipesScreen}
        options={{
          headerTitle: "Saved Recipes",
        }}
      />
    </Stack.Navigator>
  );
}
