import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

interface Preferences {
  notificationsEnabled: boolean;
  defaultStorage: "fridge" | "freezer" | "pantry";
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const { groceries, savedRecipes, shoppingList } = useApp();

  const [prefs, setPrefs] = useState<Preferences>({
    notificationsEnabled: true,
    defaultStorage: "fridge",
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const displayName: string =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "User";
  const email = user?.email ?? "";

  // Load preferences from Supabase
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            notificationsEnabled: data.notifications_enabled,
            defaultStorage:
              (data.default_storage as Preferences["defaultStorage"]) ??
              "fridge",
          });
        }
      });
  }, [user?.id]);

  const savePrefs = async (updated: Preferences) => {
    if (!user) return;
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      notifications_enabled: updated.notificationsEnabled,
      default_storage: updated.defaultStorage,
      updated_at: new Date().toISOString(),
    });
  };

  const handleToggleNotifications = async (value: boolean) => {
    const updated = { ...prefs, notificationsEnabled: value };
    setPrefs(updated);
    await savePrefs(updated);
  };

  const handleStorageChange = async (value: Preferences["defaultStorage"]) => {
    const updated = { ...prefs, defaultStorage: value };
    setPrefs(updated);
    await savePrefs(updated);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
          } catch {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {/* Avatar + name */}
      <View style={styles.profileHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="user" size={36} color={theme.textSecondary} />
          </View>
        )}
        <ThemedText type="h4" style={styles.displayName}>
          {displayName}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {email}
        </ThemedText>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.divider,
          },
        ]}
      >
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Your stats
        </ThemedText>
        <View style={styles.statsRow}>
          <StatItem
            icon="box"
            label="In pantry"
            value={groceries.length}
            theme={theme}
          />
          <StatItem
            icon="heart"
            label="Saved recipes"
            value={savedRecipes.length}
            theme={theme}
          />
          <StatItem
            icon="list"
            label="Shopping items"
            value={shoppingList.length}
            theme={theme}
          />
        </View>
      </View>

      {/* Preferences */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.divider,
          },
        ]}
      >
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Preferences
        </ThemedText>

        <View style={[styles.row, { borderColor: theme.divider }]}>
          <View style={styles.rowLeft}>
            <Feather name="bell" size={18} color={theme.text} />
            <ThemedText type="body">Expiry notifications</ThemedText>
          </View>
          <Switch
            value={prefs.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.divider, true: Colors.light.success }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.storageSection}>
          <View style={styles.rowLeft}>
            <Feather name="home" size={18} color={theme.text} />
            <ThemedText type="body">Default storage</ThemedText>
          </View>
          <View style={styles.storageOptions}>
            {(["fridge", "pantry", "freezer"] as const).map((loc) => (
              <Pressable
                key={loc}
                onPress={() => handleStorageChange(loc)}
                style={[
                  styles.storageChip,
                  {
                    backgroundColor:
                      prefs.defaultStorage === loc
                        ? theme.text
                        : theme.backgroundSecondary,
                    borderColor: theme.divider,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color:
                      prefs.defaultStorage === loc
                        ? "#FFF"
                        : theme.textSecondary,
                    fontWeight: prefs.defaultStorage === loc ? "600" : "400",
                    textTransform: "capitalize",
                  }}
                >
                  {loc}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        style={[
          styles.signOutButton,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.divider,
          },
        ]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#EF5350" />
        ) : (
          <>
            <Feather name="log-out" size={18} color="#EF5350" />
            <ThemedText type="bodyMedium" style={styles.signOutText}>
              Sign out
            </ThemedText>
          </>
        )}
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

function StatItem({
  icon,
  label,
  value,
  theme,
}: {
  icon: any;
  label: string;
  value: number;
  theme: any;
}) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon} size={20} color={theme.textSecondary} />
      <ThemedText type="h4" style={{ color: theme.text }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: {
    textAlign: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  storageSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  storageOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  storageChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  signOutButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  signOutText: {
    color: "#EF5350",
  },
});
