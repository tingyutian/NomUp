import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, AppState, AppStateStatus } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CookingTimerProps {
  durationMinutes: number;
  onComplete?: () => void;
}

export function CookingTimer({ durationMinutes, onComplete }: CookingTimerProps) {
  const { theme } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const pausedTimeRef = useRef<number | null>(null);
  
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const totalSeconds = durationMinutes * 60;
  const progress = 1 - (secondsLeft / totalSeconds);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const playAlarm = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error("Error playing alarm:", error);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        if (pausedTimeRef.current && isRunning) {
          const elapsed = Math.floor((Date.now() - pausedTimeRef.current) / 1000);
          setSecondsLeft(prev => Math.max(0, prev - elapsed));
        }
      } else if (nextAppState.match(/inactive|background/) && isRunning) {
        pausedTimeRef.current = Date.now();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsComplete(true);
            playAlarm();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft, onComplete, playAlarm]);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { 
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, progressWidth]);

  useEffect(() => {
    if (isComplete) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        5,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
    }
  }, [isComplete, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isComplete) {
      setSecondsLeft(totalSeconds);
      setIsComplete(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
    pausedTimeRef.current = null;
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setIsComplete(false);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;
  };

  const getButtonIcon = () => {
    if (isComplete) return "refresh-cw";
    if (isRunning) return "pause";
    return "play";
  };

  const getButtonText = () => {
    if (isComplete) return "Restart";
    if (isRunning) return "Pause";
    if (secondsLeft < totalSeconds) return "Resume";
    return "Start Timer";
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerBox, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { backgroundColor: isComplete ? Colors.light.success : theme.text },
              progressStyle,
            ]} 
          />
        </View>

        <Animated.View style={[styles.timeDisplay, pulseStyle]}>
          <ThemedText 
            type="h1" 
            style={[
              styles.timeText, 
              { color: isComplete ? Colors.light.success : theme.text },
            ]}
          >
            {isComplete ? "Done!" : formatTime(secondsLeft)}
          </ThemedText>
          {!isComplete && (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatTime(totalSeconds)} total
            </ThemedText>
          )}
        </Animated.View>

        <View style={styles.controls}>
          <Pressable
            onPress={handleToggle}
            style={[
              styles.mainButton, 
              { backgroundColor: isComplete ? Colors.light.success : theme.text },
            ]}
            testID="timer-toggle"
          >
            <Feather name={getButtonIcon()} size={20} color={theme.buttonText} />
            <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
              {getButtonText()}
            </ThemedText>
          </Pressable>

          {(isRunning || secondsLeft < totalSeconds) && !isComplete ? (
            <Pressable
              onPress={handleReset}
              style={[styles.resetButton, { backgroundColor: theme.backgroundTertiary }]}
              testID="timer-reset"
            >
              <Feather name="rotate-ccw" size={18} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    width: "100%",
  },
  timerBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  timeDisplay: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timeText: {
    fontSize: 32,
    lineHeight: 38,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
