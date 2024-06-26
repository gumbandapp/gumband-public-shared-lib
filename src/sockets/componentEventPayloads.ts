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
    exhibitId: number,
    componentId: string | number; // uuid or number
    category: ComponentCategory;
    connectedChangedAt: string; // ISO 8601 timestamp
};

export type ComponentDisconnectedPayload = ComponentConnectedPayload;

// V2 Hardware Events
export type HardwareProperty = {
    value: V2JsonPropertyValue,
    format: string,
    path: string,
    source: 'system' | 'app',
    componentId: string,
}

export type HardwarePropertyUpdatePayload = {
    exhibitId: number,
    componentId: string,
    category: ComponentCategory,
    property: HardwareProperty,
}

// V1 Hardware Events
export type HardwareOfflinePayload = {
    hardwareId: number;
};

export type HardwareOnlinePayload = {
    hardwareId: number;
};
