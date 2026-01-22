import React, { useState, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ScanReceipt">;

export default function ScanReceiptScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      
      if (photo?.base64) {
        navigation.navigate("ConfirmItems", { imageBase64: photo.base64 });
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      navigation.navigate("ConfirmItems", { imageBase64: result.assets[0].base64 });
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Animated.View entering={FadeIn} style={styles.permissionContent}>
          <Feather name="camera" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText type="body" style={[styles.permissionText, { color: theme.textSecondary }]}>
            NomUp needs camera access to scan your grocery receipts
          </ThemedText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Enable Camera
          </Button>
          {Platform.OS !== "web" && permission.canAskAgain === false ? (
            <ThemedText type="small" style={[styles.settingsHint, { color: theme.textSecondary }]}>
              Camera permission was denied. Please enable it in Settings.
            </ThemedText>
          ) : null}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {Platform.OS === "web" ? (
        <View style={[styles.webFallback, { paddingTop: insets.top }]}>
          <Feather name="camera-off" size={64} color="#FFF" />
          <ThemedText type="h4" style={styles.webText}>
            Camera not available on web
          </ThemedText>
          <ThemedText type="body" style={styles.webSubtext}>
            Run in Expo Go to use the camera feature
          </ThemedText>
          <Button onPress={handlePickImage} style={styles.galleryButton}>
            Choose from Gallery
          </Button>
        </View>
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={[styles.overlay, { paddingTop: insets.top }]}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Feather name="arrow-left" size={24} color="#FFF" />
              </Pressable>
              <ThemedText type="bodyMedium" style={styles.headerText}>
                Scan Receipt
              </ThemedText>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.frameContainer}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <ThemedText type="small" style={styles.hint}>
                Position your receipt within the frame
              </ThemedText>
            </View>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
              <Pressable onPress={handlePickImage} style={styles.iconButton}>
                <Feather name="image" size={28} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={handleCapture}
                style={[styles.captureButton, isCapturing ? styles.capturing : undefined]}
                disabled={isCapturing}
              >
                <View style={styles.captureInner} />
              </Pressable>
              <View style={{ width: 56 }} />
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#FFF",
  },
  frameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: "80%",
    aspectRatio: 0.7,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hint: {
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.xl,
  },
  iconButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  capturing: {
    opacity: 0.5,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
  },
  permissionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    width: "100%",
    maxWidth: 300,
  },
  settingsHint: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  webText: {
    color: "#FFF",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  webSubtext: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: Spacing.xl,
  },
  galleryButton: {
    width: "80%",
  },
});
