import React, { useState } from "react";
import { Alert, Platform, Modal, View, Pressable, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import PantryScreen from "@/screens/PantryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export type PantryStackParamList = {
  PantryMain: undefined;
};

const Stack = createNativeStackNavigator<PantryStackParamList>();

function ResetButton() {
  const { theme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setShowConfirm(false);
    await AsyncStorage.multiRemove([
      "@nomup_groceries",
      "@nomup_shopping_list",
      "@nomup_onboarding_complete",
      "@nomup_saved_recipes",
    ]);
    await reloadAppAsync();
  };

  return (
    <>
      <HeaderButton
        onPress={() => setShowConfirm(true)}
        testID="button-reset-data"
      >
        <Feather name="trash-2" size={18} color={theme.textSecondary} />
      </HeaderButton>
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={resetStyles.overlay}>
          <View style={[resetStyles.content, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={resetStyles.title}>
              Reset All Data?
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
              This will clear your pantry, shopping list, and onboarding state. The app will restart.
            </ThemedText>
            <View style={resetStyles.buttons}>
              <Pressable
                onPress={() => setShowConfirm(false)}
                style={[resetStyles.button, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="bodyMedium">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleReset}
                style={[resetStyles.button, { backgroundColor: Colors.light.expiredRed }]}
              >
                <ThemedText type="bodyMedium" style={{ color: "#FFF" }}>Reset</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const resetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    width: "100%",
    maxWidth: 768,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.md,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function PantryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PantryMain"
        component={PantryScreen}
        options={{
          headerTitle: "Pantry",
          headerLeft: () => <ResetButton />,
        }}
      />
    </Stack.Navigator>
  );
}
