import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WelcomeScreen from "@/screens/WelcomeScreen";
import ScanReceiptScreen from "@/screens/ScanReceiptScreen";
import ConfirmItemsScreen from "@/screens/ConfirmItemsScreen";
import RecipeFeedScreen from "@/screens/RecipeFeedScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import RecipeSuggestionScreen from "@/screens/RecipeSuggestionScreen";
import RecipeResultsScreen from "@/screens/RecipeResultsScreen";
import AIRecipeDetailScreen from "@/screens/AIRecipeDetailScreen";
import CookingModeScreen from "@/screens/CookingModeScreen";
import CookingCompleteScreen from "@/screens/CookingCompleteScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/theme";

export interface ScoredRecipe {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  instructions: string;
  ingredients: string[];
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  stats: {
    total: number;
    matched: number;
    missing: number;
  };
}

export interface GeneratedRecipe {
  id: string;
  title: string;
  totalTime: number;
  servings: number;
  matchScore: number;
  thumbnail?: string;
  source: "ai";
  usedIngredients: Array<{
    groceryItemId: string;
    name: string;
    amount: string;
    prepNotes?: string;
  }>;
  missingIngredients: Array<{
    name: string;
    amount: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }>;
}

export interface SelectedIngredient {
  id: string;
  name: string;
}

export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
  ScanReceipt: undefined;
  ConfirmItems: { imageBase64: string };
  RecipeFeed: { itemId: string; itemName: string };
  RecipeDetail: { recipe: ScoredRecipe };
  RecipeSuggestion: undefined;
  RecipeResults: { recipes: GeneratedRecipe[]; selectedIngredients: SelectedIngredient[] };
  AIRecipeDetail: { recipe: GeneratedRecipe; selectedIngredients: SelectedIngredient[] };
  CookingMode: { recipe: GeneratedRecipe; selectedIngredients: SelectedIngredient[] };
  CookingComplete: { recipe: GeneratedRecipe; selectedIngredients: SelectedIngredient[] };
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
        }}
      />
      <Stack.Screen
        name="ConfirmItems"
        component={ConfirmItemsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RecipeFeed"
        component={RecipeFeedScreen}
        options={{
          headerTitle: "Recipes",
        }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="RecipeSuggestion"
        component={RecipeSuggestionScreen}
        options={{
          headerTitle: "Recipe Ideas",
        }}
      />
      <Stack.Screen
        name="RecipeResults"
        component={RecipeResultsScreen}
        options={{
          headerTitle: "Recipe Ideas",
        }}
      />
      <Stack.Screen
        name="AIRecipeDetail"
        component={AIRecipeDetailScreen}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="CookingMode"
        component={CookingModeScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="CookingComplete"
        component={CookingCompleteScreen}
        options={{
          headerTitle: "Log Ingredients",
        }}
      />
    </Stack.Navigator>
  );
}
