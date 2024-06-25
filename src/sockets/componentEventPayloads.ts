import type { ObjectValues } from '../utils/usefulTS';

export type ExhibitOfflinePayload = {
    exhibitId: string; // should be a number, but is sent down as a string
    lastOnlineChange: string; // ISO 8601 timestamp
};

export type ExhibitOnlinePayload = {
    exhibitId: string; // should be a number, but is sent down as a string
    lastOnlineChange: string; // ISO 8601 timestamp
};

export const COMPONENT_CATEGORY = {
    SOFTWARE: 'software',
    HARDWARE: 'hardware',
} as const;

export type ComponentCategory = ObjectValues<typeof COMPONENT_CATEGORY>;

export const COMPONENT_TYPE = {
    CUSTOM_APPLICATION: 'custom-application',
    OS_MONITOR: 'os-monitor',
    CUSTOM_HARDWARE: 'custom-hardware',
    PRESENCE_SENSOR: 'presence-sensor',
} as const;

export type ComponentType = ObjectValues<typeof COMPONENT_TYPE>;

export type ComponentConnectedPayload = {
    componentId: string | number; // uuid or number
    category: ComponentCategory;
    connectedChangedAt: string; // ISO 8601 timestamp
};

export type ComponentDisconnectedPayload = ComponentConnectedPayload;

export type HardwareOfflinePayload = {
    hardwareId: number;
};

export type HardwareOnlinePayload = {
    hardwareId: number;
};
