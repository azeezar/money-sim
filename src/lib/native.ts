import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Phone-only extras. On the website every call here does nothing. */
export const native = Capacitor.isNativePlatform();

export const buzz = (): void => void (native && Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
export const buzzWin = (): void => void (native && Haptics.notification({ type: NotificationType.Success }).catch(() => {}));

const REMINDER = 1;

/** Turns the 6pm daily reminder on or off. Resolves false if the user has blocked notifications. */
export async function setReminder(on: boolean, mascotName: string): Promise<boolean> {
  if (!native) return false;
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER }] }).catch(() => {});
  if (!on) return true;
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  await LocalNotifications.schedule({
    notifications: [{ id: REMINDER, title: `${mascotName} misses you`, body: 'A quick lesson or game keeps your streak alive.', schedule: { on: { hour: 18, minute: 0 }, allowWhileIdle: true } }],
  });
  return true;
}
