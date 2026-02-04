import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PERMISSION_KEY = "@nomup_notification_permission_requested";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function hasRequestedPermission(): Promise<boolean> {
  const requested = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  return requested === "true";
}

export async function markPermissionRequested(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "true");
}

export async function scheduleExpiringItemNotification(
  itemName: string,
  daysUntilExpiration: number,
  itemId: string
): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  await Notifications.cancelScheduledNotificationAsync(itemId).catch(() => {});

  if (daysUntilExpiration <= 0) {
    return null;
  }

  let triggerDays = daysUntilExpiration - 2;
  let message = `${itemName} expires in 2 days. Time to cook something delicious!`;

  if (daysUntilExpiration <= 2) {
    triggerDays = 0;
    message = daysUntilExpiration === 1
      ? `${itemName} expires tomorrow! Don't let it go to waste.`
      : `${itemName} expires today! Use it before it's too late.`;
  }

  const triggerSeconds = Math.max(triggerDays * 24 * 60 * 60, 5);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Ingredient Expiring Soon",
      body: message,
      data: { itemId, type: "expiring_item" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
    identifier: itemId,
  });

  return notificationId;
}

export async function cancelItemNotification(itemId: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  
  await Notifications.cancelScheduledNotificationAsync(itemId).catch(() => {});
}

export async function scheduleNotificationsForItems(
  items: Array<{ id: string; name: string; expiresIn: number }>
): Promise<void> {
  for (const item of items) {
    if (item.expiresIn > 0 && item.expiresIn <= 5) {
      await scheduleExpiringItemNotification(item.name, item.expiresIn, item.id);
    }
  }
}
