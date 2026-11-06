import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

/**
 * The OS prompts, in turn. Location is when-in-use only; Home falls back to
 * the profile's city when it is denied. Failures count as "not now".
 */
export async function requestOsPermissions({ location, notifications }: { location: boolean; notifications: boolean }) {
  const result = { location: false, notifications: false };
  if (location) {
    try {
      result.location = (await Location.requestForegroundPermissionsAsync()).status === 'granted';
    } catch {
      result.location = false;
    }
  }
  if (notifications) {
    try {
      const n = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
      result.notifications = n.granted;
    } catch {
      result.notifications = false;
    }
  }
  return result;
}
