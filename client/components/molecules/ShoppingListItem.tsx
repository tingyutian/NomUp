import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Checkbox } from "@/components/atoms/Checkbox";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { ShoppingListItem as ShoppingListItemType } from "@/context/AppContext";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  testID?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function ShoppingListItemCard({
  item,
  onToggle,
  onEdit,
  onDelete,
  testID,
}: ShoppingListItemProps) {
  const { theme } = useTheme();
  const strikethrough = useSharedValue(item.checked ? 1 : 0);

  React.useEffect(() => {
    strikethrough.value = withSpring(item.checked ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [item.checked]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: 1 - strikethrough.value * 0.5,
  }));

  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <Checkbox
        checked={item.checked}
        onToggle={onToggle}
        testID={`${testID}-checkbox`}
      />
      <AnimatedView style={[styles.content, textStyle]}>
        <ThemedText
          type="body"
          style={[
            styles.name,
            item.checked ? { textDecorationLine: "line-through", color: theme.textSecondary } : undefined,
          ]}
        >
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.quantity} {item.unit}
        </ThemedText>
      </AnimatedView>
      <View style={styles.actions}>
        {onEdit ? (
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Feather name="edit-2" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.actionButton}>
            <Feather name="trash-2" size={18} color={theme.expiredRed} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});
