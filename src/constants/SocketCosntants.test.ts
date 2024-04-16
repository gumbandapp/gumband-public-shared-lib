// Ensure SocketContants exports the right constants

import { SOCKETS } from './SocketConstants';

describe('SocketConstants', () => {
    it('should have the correct values', () => {
        expect(SOCKETS).toEqual({
            HANDSHAKE: 'HANDSHAKE',
            HANDSHAKE_SUCCESSFUL: 'HANDSHAKE_SUCCESSFUL',
            SUBSCRIBE: 'SUBSCRIBE',
            SUBSCRIBE_MULTIPLE_EXHIBITS: 'SUBSCRIBE_MULTIPLE_EXHIBITS',
            UNSUBSCRIBE_MULTIPLE_EXHIBITS: 'UNSUBSCRIBE_MULTIPLE_EXHIBITS',
            SUBSCRIBE_MULTIPLE_HARDWARE: 'SUBSCRIBE_MULTIPLE_HARDWARE',
            UNSUBSCRIBE_MULTIPLE_HARDWARE: 'UNSUBSCRIBE_MULTIPLE_HARDWARE',
            SUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE: 'SUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE',
            UNSUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE: 'UNSUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE',
            SDK: 'SDK',
            ERROR: 'ERROR',
            FRONTEND: 'FRONTEND',
            EXHIBIT_ONLINE: 'EXHIBIT_ONLINE',
            EXHIBIT_OFFLINE: 'EXHIBIT_OFFLINE',
            CONTROL_RECEIVED: 'CONTROL_RECEIVED',
            SETTING_RECEIVED: 'SETTING_RECEIVED',
            SETTING_LIST_RECEIVED: 'SETTING_LIST_RECEIVED',
            SETTING_LIST_ITEM_DELETED: 'SETTING_LIST_ITEM_DELETED',
            STATUS_RECEIVED: 'STATUS_RECEIVED',
            OP_MODE_RECEIVED: 'OP_MODE_RECEIVED',
            CONTROL_DEBUG_RECEIVED: 'CONTROL_DEBUG_RECEIVED',
            CLOSE_SDK_CONNECTION: 'CLOSE_SDK_CONNECTION',
            NEW_MANIFEST: 'NEW_MANIFEST',
            HARDWARE_ONLINE: 'HARDWARE_ONLINE',
            HARDWARE_OFFLINE: 'HARDWARE_OFFLINE',
            HARDWARE_UPDATED: 'HARDWARE_UPDATED',
            HARDWARE_LOG: 'HARDWARE_LOG',
            HARDWARE_HEARTBEAT: 'HARDWARE_HEARTBEAT',
            HARDWARE_PROPERTY_RECEIVED: 'HARDWARE_PROPERTY_RECEIVED',
            MQTT_PATH_UPDATED: 'MQTT_PATH_UPDATED',
            EXHIBIT_LOG: 'EXHIBIT_LOG',
            EXHIBIT_TOUCHLESS_SESSION_RECEIVED: 'EXHIBIT_TOUCHLESS_SESSION_RECEIVED',
            EXHIBIT_TOUCHLESS_TOKEN_ROTATED: 'EXHIBIT_TOUCHLESS_TOKEN_ROTATED',
            PERIPH_EVENT: 'PERIPH_EVENT',
            FILE_UPLOADED: 'FILE_UPLOADED',
            FILE_DELETED: 'FILE_DELETED',
            READY: 'READY',
            SERVER_PING_MS: 10 * 1000,
            SERVER_HANDSHAKE_DISCONNECT_MS: 2 * 1000,
            SDK_OFFLINE_MS: 11 * 1000,
            SDK_RECONNECT_DELAY_MS: 3 * 1000,
            HARDWARE_CONNECTION_TO_EXHIBIT_UPDATED: 'HARDWARE_CONNECTION_TO_EXHIBIT_UPDATED',
        });
    });
});
