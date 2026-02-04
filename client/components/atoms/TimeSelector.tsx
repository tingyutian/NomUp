import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TimeSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  options?: number[];
  testID?: string;
}

export function TimeSelector({
  value,
  onValueChange,
  options = [15, 30, 60],
  testID,
}: TimeSelectorProps) {
  const { theme } = useTheme();

  const handleSelect = (time: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(time);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    return `${minutes / 60} hr`;
  };

  return (
    <View style={styles.container} testID={testID}>
      <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
        COOKING TIME
      </ThemedText>
      <View style={[styles.segmentContainer, { backgroundColor: theme.backgroundSecondary }]}>
        {options.map((time, index) => {
          const isSelected = value === time;
          return (
            <Pressable
              key={time}
              onPress={() => handleSelect(time)}
              style={[
                styles.segment,
                isSelected && { backgroundColor: theme.text },
                index === 0 && styles.firstSegment,
                index === options.length - 1 && styles.lastSegment,
              ]}
              testID={`time-option-${time}`}
            >
              <ThemedText
                type="bodyMedium"
                style={[
                  styles.segmentText,
                  { color: isSelected ? theme.buttonText : theme.text },
                ]}
              >
                {formatTime(time)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  firstSegment: {
    borderTopLeftRadius: BorderRadius.sm,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  lastSegment: {
    borderTopRightRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  segmentText: {
    fontWeight: "600",
  },
});
