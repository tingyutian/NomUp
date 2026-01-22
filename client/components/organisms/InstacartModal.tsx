import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { ShoppingListItem } from "@/context/AppContext";

interface InstacartModalProps {
  visible: boolean;
  onClose: () => void;
  items: ShoppingListItem[];
  onComplete: () => void;
}

export function InstacartModal({
  visible,
  onClose,
  items,
  onComplete,
}: InstacartModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [preferOrganic, setPreferOrganic] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToInstacart = async () => {
    setIsLoading(true);
    
    const searchTerms = items
      .filter((item) => !item.checked)
      .map((item) => {
        const prefix = preferOrganic ? "organic " : "";
        return `${prefix}${item.name}`;
      })
      .join(", ");
    
    const instacartUrl = `https://www.instacart.com/store/search/${encodeURIComponent(searchTerms)}`;
    
    try {
      await WebBrowser.openBrowserAsync(instacartUrl);
      onComplete();
      onClose();
    } catch (error) {
      console.error("Error opening Instacart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setPreferOrganic(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={resetAndClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={resetAndClose} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.backgroundRoot,
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">Add to Instacart</ThemedText>
            <Pressable onPress={resetAndClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Do you prefer organic products?
          </ThemedText>

          <View style={styles.options}>
            <Pressable
              onPress={() => setPreferOrganic(true)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    preferOrganic === true
                      ? Colors.light.produce
                      : theme.backgroundDefault,
                  borderColor: preferOrganic === true ? theme.text : theme.divider,
                },
              ]}
            >
              <Feather
                name="check-circle"
                size={24}
                color={preferOrganic === true ? theme.text : theme.textSecondary}
              />
              <ThemedText type="bodyMedium" style={styles.optionText}>
                I prefer organic food
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setPreferOrganic(false)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    preferOrganic === false
                      ? theme.backgroundSecondary
                      : theme.backgroundDefault,
                  borderColor: preferOrganic === false ? theme.text : theme.divider,
                },
              ]}
            >
              <Feather
                name="circle"
                size={24}
                color={preferOrganic === false ? theme.text : theme.textSecondary}
              />
              <ThemedText type="bodyMedium" style={styles.optionText}>
                It doesn't matter to me
              </ThemedText>
            </Pressable>
          </View>

          <Button
            onPress={handleAddToInstacart}
            disabled={preferOrganic === null || isLoading}
            style={styles.continueButton}
          >
            {isLoading ? "Opening Instacart..." : "Continue to Instacart"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: "85%",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionText: {
    marginLeft: Spacing.md,
  },
  continueButton: {
    marginTop: Spacing.sm,
  },
});
