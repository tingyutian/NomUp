import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ShoppingListScreen from "@/screens/ShoppingListScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ShoppingStackParamList = {
  ShoppingList: undefined;
};

const Stack = createNativeStackNavigator<ShoppingStackParamList>();

export default function ShoppingStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          headerTitle: "Shopping",
        }}
      />
    </Stack.Navigator>
  );
}
