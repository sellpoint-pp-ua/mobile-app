import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Constants.appOwnership === "expo") {
      console.log("[push] Skip registering token on Expo Go");
      return null;
    }

    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    let expoToken:
      | Notifications.ExpoPushToken
      | { data: string; type: "expo" };

    if (projectId) {
      expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
    } else {
      expoToken = await Notifications.getExpoPushTokenAsync();
    }

    return expoToken.data || null;
  } catch (e) {
    console.warn("registerForPushNotificationsAsync error:", e);
    return null;
  }
}

export async function notifyWelcome(name?: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Раді вас бачити! 🎉",
        body: name
          ? `Вітаємо, ${name}! Гарного шопінгу на SellPoint.`
          : "Гарного шопінгу на SellPoint.",
        sound: false,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn("notifyWelcome error:", e);
  }
}

export async function sendPushTokenToBackend(expoPushToken: string) {
  try {
    if (!expoPushToken) return;
    console.log("Expo push token:", expoPushToken);
  } catch (e) {
    console.warn("sendPushTokenToBackend error:", e);
  }
}
