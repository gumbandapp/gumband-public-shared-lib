import type { ObjectValues } from '../utils';
import { NOTIFICATION_TYPES, type NotificationType } from './NotificationTypes';

export const EXHIBIT_ALERT_TYPES: Record<string, NotificationType> = {
    NOTIFY: NOTIFICATION_TYPES.notify,
    NOTIFY_CONNECTED: NOTIFICATION_TYPES.notify_connected,
    NOTIFY_EXHIBIT_HEALTH: NOTIFICATION_TYPES.notify_exhibit_health,
    NOTIFY_HARDWARE_CHANGE: NOTIFICATION_TYPES.notify_hardware_change,
    NOTIFY_SCENE_CHANGES: NOTIFICATION_TYPES.notify_scene_changes,
} as const;

export type ExhibitAlertType = ObjectValues<
  typeof EXHIBIT_ALERT_TYPES
>;

export const isExhibitAlertType = (
    value: unknown,
): value is ExhibitAlertType => {
    return Object.values(EXHIBIT_ALERT_TYPES).includes(value as ExhibitAlertType);
};
