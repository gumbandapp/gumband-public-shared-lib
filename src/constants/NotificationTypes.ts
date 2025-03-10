import type { ObjectValues } from '../utils';

export const NOTIFICATION_TYPES = {
    notify: 'notify',
    notify_op_mode: 'notify_op_mode',
    notify_connected: 'notify_connected',
    notify_error_logs: 'notify_error_logs',
    notify_exhibit_health: 'notify_exhibit_health',
    notify_on_delete: 'notify_on_delete',
    notify_scene_changes: 'notify_scene_changes',
    notify_hardware_change: 'notify_hardware_change',
    notify_hardware_notification: 'notify_hardware_notification',
} as const;
export type NotificationType = ObjectValues<typeof NOTIFICATION_TYPES>;
