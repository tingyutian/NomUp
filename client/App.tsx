import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

const MAX_APP_WIDTH = 768;

export default function App() {
  const content = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer>
                  <RootStackNavigator />
                </NavigationContainer>
                <StatusBar style="dark" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  innerContainer: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_APP_WIDTH,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
});
