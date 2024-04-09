// Ensure that Notification Types exports the right constants

import { NOTIFICATION_TYPES } from './NotificationTypes';

describe('NotificationTypes', () => {
    it('should have the correct values', () => {
        expect(NOTIFICATION_TYPES).toEqual({
            notify: 'notify',
            notify_op_mode: 'notify_op_mode',
            notify_connected: 'notify_connected',
            notify_error_logs: 'notify_error_logs',
            notify_on_delete: 'notify_on_delete',
            notify_scene_changes: 'notify_scene_changes',
            notify_hardware_change: 'notify_hardware_change',
            notify_hardware_notification: 'notify_hardware_notification',
        });
    });
});
