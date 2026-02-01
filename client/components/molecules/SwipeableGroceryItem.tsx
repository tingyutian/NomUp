import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { GroceryItem as GroceryItemType } from "@/context/AppContext";

interface SwipeableGroceryItemProps {
  item: GroceryItemType;
  onPress: () => void;
  onDelete: () => void;
  testID?: string;
}

const SWIPE_THRESHOLD = -80;
const DELETE_BUTTON_WIDTH = 80;

const categoryColors: Record<string, string> = {
  produce: Colors.light.produce,
  dairy: Colors.light.dairy,
  bakery: Colors.light.bakery,
  meat: Colors.light.meat,
  pantry: Colors.light.pantry,
  frozen: Colors.light.frozen,
};

export function SwipeableGroceryItem({
  item,
  onPress,
  onDelete,
  testID,
}: SwipeableGroceryItemProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const isOpen = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -DELETE_BUTTON_WIDTH);
      } else if (isOpen.value) {
        translateX.value = Math.min(0, -DELETE_BUTTON_WIDTH + event.translationX);
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_BUTTON_WIDTH, { damping: 20, stiffness: 200 });
        isOpen.value = true;
        runOnJS(triggerHaptic)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    })
    .onEnd(() => {
      if (!isOpen.value) {
        runOnJS(onPress)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / DELETE_BUTTON_WIDTH),
  }));

  const getExpirationColor = () => {
    if (item.expiresIn <= 0) return theme.expiredRed;
    if (item.expiresIn <= 2) return theme.expiringOrange;
    if (item.expiresIn <= 5) return theme.expiringYellow;
    return theme.backgroundSecondary;
  };

  const getExpirationText = () => {
    if (item.expiresIn < 0) return `Expired ${Math.abs(item.expiresIn)}d ago`;
    if (item.expiresIn === 0) return "Expires today";
    if (item.expiresIn === 1) return "Expires tomorrow";
    return `Exp. in ${item.expiresIn}d`;
  };

  const categoryColor = categoryColors[item.category.toLowerCase()] || Colors.light.pantry;

  const handleDeletePress = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    isOpen.value = false;
    onDelete();
  };

  return (
    <View style={styles.wrapper} testID={testID}>
      <Animated.View style={[styles.deleteButtonContainer, deleteButtonStyle]}>
        <Pressable
          onPress={handleDeletePress}
          style={styles.deleteButton}
          testID={`${testID}-delete-btn`}
        >
          <Feather name="trash-2" size={20} color="#FFF" />
          <ThemedText type="small" style={styles.deleteText}>
            Delete
          </ThemedText>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.backgroundDefault },
            animatedStyle,
          ]}
        >
          <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.nameContainer}>
                <ThemedText type="bodyMedium" numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <Badge
                  label={item.category}
                  variant="category"
                  category={item.category}
                  style={styles.categoryBadge}
                />
              </View>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </View>
            <View style={styles.usageDots}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.usageDot,
                    {
                      backgroundColor: i < item.usedAmount ? theme.text : theme.divider,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.bottomRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.quantity} x {item.unitAmount || 1} {item.unit}
              </ThemedText>
              <View style={[styles.expirationBadge, { backgroundColor: getExpirationColor() }]}>
                <ThemedText type="caption" style={styles.expirationText}>
                  {getExpirationText()}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  deleteButtonContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: Spacing.md,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#E53935",
    width: DELETE_BUTTON_WIDTH - 8,
    height: "100%",
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#FFF",
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  categoryIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  expirationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  expirationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  usageDots: {
    flexDirection: "row",
    gap: 4,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  usageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
