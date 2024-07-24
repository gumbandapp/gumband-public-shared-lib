import { AnyPropertyType, AnySource, FormattedPropertyValue } from '../types/mqtt-api';
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

/**
 * Type guard for the ComponentCategory type
 *
 * @param {unknown} componentCategory - the unknown ComponentCategory
 * @return {boolean} - true if typeof componentCategory is ComponentCategory
 */
export function isComponentCategory (componentCategory: unknown): componentCategory is ComponentCategory {
    return (
        typeof componentCategory === 'string' &&
        Object.values(COMPONENT_CATEGORY).includes(componentCategory as ComponentCategory)
    );
}

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
    componentId: string, // parent hardware componentId
    source: AnySource,
    path: string, // Unique within each source
    index: number, // Unique within each source
    type: AnyPropertyType,
    format: string,
    value: FormattedPropertyValue,
    arrayLength: number, // length of value
    settable: boolean,
    gettable: boolean,
    uiHidden: boolean,
}

export type ComponentPropertyReceivedPayload = {
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
