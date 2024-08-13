
export * from './authorizationAndSubscriptionEventPayloads';
export * from './componentEventPayloads';
export * from './exhibitEventPayloads';

import type {
    HandshakePayload,
    SubscribeMultipleExhibitsPayload,
    SubscribeMultipleHardwarePayload,
    UnsubscribeMultipleExhibitsPayload,
    UnsubscribeMultipleHardwarePayload,
} from './authorizationAndSubscriptionEventPayloads';
import type {
    ComponentAddedToExhibitPayload,
    ComponentRemovedFromExhibitPayload,
    ComponentConnectedPayload,
    ComponentDisconnectedPayload,
    ComponentPropertyReceivedPayload,
    ExhibitOfflinePayload,
    ExhibitOnlinePayload,
    HardwareOfflinePayload,
    HardwareOnlinePayload,
} from './componentEventPayloads';
import type {
    ExhibitHealthStateUpdatePayload,
    ExhibitOpModeReceivedPayload,
    ExhibitSettingListReceivedPayload,
    ExhibitSettingReceivedPayload,
    ExhibitStatusReceivedPayload,
} from './exhibitEventPayloads';

// NOTE: Since socket payloads are actually sent as stringified JSON, it might actually
// make sense to create zod validators and use the infer to create the types for the payload.
// That way we can ensure that the payload is always valid.

// There should be a key for each SocketEventType.  There isn't a way to enforce this in TypeScript
export type SocketEventPayloadMap = {
    // Authorization and Subscription Events
    HANDSHAKE: HandshakePayload;
    SUBSCRIBE_MULTIPLE_EXHIBITS: SubscribeMultipleExhibitsPayload;
    SUBSCRIBE_MULTIPLE_HARDWARE: SubscribeMultipleHardwarePayload;
    UNSUBSCRIBE_MULTIPLE_EXHIBITS: UnsubscribeMultipleExhibitsPayload;
    UNSUBSCRIBE_MULTIPLE_HARDWARE: UnsubscribeMultipleHardwarePayload;
    // Component Events
    EXHIBIT_OFFLINE: ExhibitOfflinePayload;
    EXHIBIT_ONLINE: ExhibitOnlinePayload;
    COMPONENT_ADDED_TO_EXHIBIT: ComponentAddedToExhibitPayload;
    COMPONENT_REMOVED_FROM_EXHIBIT: ComponentRemovedFromExhibitPayload;
    COMPONENT_CONNECTED: ComponentConnectedPayload;
    COMPONENT_DISCONNECTED: ComponentDisconnectedPayload;
    COMPONENT_PROPERTY_RECEIVED: ComponentPropertyReceivedPayload;
    // V1 Hardware Events
    HARDWARE_OFFLINE: HardwareOfflinePayload;
    HARDWARE_ONLINE: HardwareOnlinePayload;
    // Exhibit Events
    SETTING_LIST_RECEIVED: ExhibitSettingListReceivedPayload;
    SETTING_RECEIVED: ExhibitSettingReceivedPayload;
    STATUS_RECEIVED: ExhibitStatusReceivedPayload;
    OP_MODE_RECEIVED: ExhibitOpModeReceivedPayload;
    EXHIBIT_HEALTH_UPDATED: ExhibitHealthStateUpdatePayload;
    // The following events are known, however their payloads have not been defined
    SUBSCRIBE: unknown;
    SUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE: unknown;
    UNSUBSCRIBE_MULTIPLE_EXHIBITS_AND_HARDWARE: unknown;
    SDK: unknown;
    ERROR: unknown;
    FRONTEND: unknown;
    CONTROL_RECEIVED: unknown;
    SETTING_LIST_ITEM_DELETED: unknown;
    CONTROL_DEBUG_RECEIVED: unknown;
    CLOSE_SDK_CONNECTION: unknown;
    NEW_MANIFEST: unknown;
    HARDWARE_UPDATED: unknown;
    HARDWARE_LOG: unknown;
    HARDWARE_HEARTBEAT: unknown;
    HARDWARE_PROPERTY_RECEIVED: unknown;
    MQTT_PATH_UPDATED: unknown;
    EXHIBIT_LOG: unknown;
    EXHIBIT_TOUCHLESS_SESSION_RECEIVED: unknown;
    EXHIBIT_TOUCHLESS_TOKEN_ROTATED: unknown;
    PERIPH_EVENT: unknown;
    FILE_UPLOADED: unknown;
    FILE_DELETED: unknown;
    READY: unknown;
    HARDWARE_CONNECTION_TO_EXHIBIT_UPDATED: unknown;
};

export * from './authorizationAndSubscriptionEventPayloads';
export * from './componentEventPayloads';
export * from './exhibitEventPayloads';

