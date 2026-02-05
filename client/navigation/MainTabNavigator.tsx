import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PantryStackNavigator from "@/navigation/PantryStackNavigator";
import ShoppingStackNavigator from "@/navigation/ShoppingStackNavigator";
import SavedStackNavigator from "@/navigation/SavedStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedText } from "@/components/ThemedText";

export type MainTabParamList = {
  PantryTab: undefined;
  SavedTab: undefined;
  ListTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function FloatingAddButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => navigation.navigate("ScanReceipt")}
      style={[
        styles.floatingAddButton,
        { 
          backgroundColor: theme.text,
          bottom: 100 + insets.bottom,
        }
      ]}
      testID="floating-add-button"
    >
      <Feather name="plus" size={28} color={theme.buttonText} />
    </Pressable>
  );
}

function ShoppingBadge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <ThemedText type="caption" style={styles.badgeText}>
        {count > 99 ? "99+" : count}
      </ThemedText>
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { shoppingList } = useApp();
  const uncheckedCount = shoppingList.filter((item) => !item.checked).length;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="PantryTab"
        screenOptions={{
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: Colors.light.backgroundRoot,
            }),
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tab.Screen
          name="PantryTab"
          component={PantryStackNavigator}
          options={{
            title: "PANTRY",
            tabBarIcon: ({ color, size }) => (
              <Feather name="box" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SavedTab"
          component={SavedStackNavigator}
          options={{
            title: "SAVED",
            tabBarIcon: ({ color, size }) => (
              <Feather name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ListTab"
          component={ShoppingStackNavigator}
          options={{
            title: "LIST",
            tabBarIcon: ({ color, size }) => (
              <View>
                <Feather name="list" size={size} color={color} />
                <ShoppingBadge count={uncheckedCount} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  floatingAddButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.expiredRed,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
