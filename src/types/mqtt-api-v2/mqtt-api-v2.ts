import type { DataType } from 'python-struct';

export const V2ApiVersions = [2] as const;

export type V2ApiVersion = (typeof V2ApiVersions)[number];

export const V2DeviceTypes = ['generic', 'presence'] as const;

export type V2DeviceType = (typeof V2DeviceTypes)[number];

export const V2DeviceCapabilities = ['OTA', 'identify', 'filesystem'] as const;

export type V2DeviceCapability = (typeof V2DeviceCapabilities)[number];

export type V2DeviceMetadata = {
    platform: string,
    variant: string,
    ver?: string,
    gb_pkg_ver?: string,
    bootloader_ver?: string,
};

// TODO: add some comments regarding expected formats from the Confluence Doc
export interface V2DeviceInfo {
    api_ver: V2ApiVersion,

    name?: string,
    type: V2DeviceType,
    capabilities: Array<V2DeviceCapability | string>,

    device?: V2DeviceMetadata,

    mac: string,
    ip: string,
    num_props: number,
}

export type V2ApplicationInfo = {
    ver: string,
    file_name: string,
    gb_pkg_ver?: string,
    num_props: number,
};

// TODO: [long-term] migrate these hard-coded property types to db-stored configurable types
export const V2PropertyTypes = [
    'gmbnd_primitive',
    'gmbnd_color',
    'gmbnd_led',
] as const;

export const V2Sources = [
    'device',
    'app',
] as const;

export type V2Source = (typeof V2Sources)[number];

export type V2PropertyType = (typeof V2PropertyTypes)[number];

export type V2PropertyFormat = string;

export type V2PropertyRegistration = {
    path: string,
    index: number,
    desc?: string,
    type: V2PropertyType,
    format: V2PropertyFormat,
    length: number,
    settable: boolean,
    gettable: boolean,
    min?: number,
    step?: number,
    max?: number,
    ui_hidden?: boolean,
};

export type V2HardwareManifest = {
    apiVersion: V2ApiVersion,
    device: V2DeviceInfo,
    isRegistered: boolean,
    application: V2ApplicationInfo,
    properties: Array<V2PropertyRegistration>,
};

interface V2DeviceConnectionSummary {
    name: string,
    address: string,
    port: number,
    enabled: boolean,
    secure: boolean,
    static: boolean,
    prop_interact: boolean,
}

export type V2DeviceConnections = {
    servers: Array<V2DeviceConnectionSummary>
};

export interface V2DeviceConnectionStatus extends V2DeviceConnectionSummary {
    // TODO make the status value more explicit.
    status: number, // 1 indicates healthy connection, 0 or negative number corresponds to specific error code: 0 - not connected, -1 - can't find, -2 - bad auth, ...
    uptime: number,
}

export type V2DeviceConnectionsStatus = {
    servers: Array<V2DeviceConnectionStatus>
};

export const V2DeviceInfoTopic = 'device/info' as const;

export const V2ApiTopics = [
    V2DeviceInfoTopic,
    'device/prop',
    'device/connections',
    'app/info',
    'app/prop',
] as const;


export const V2ApiSubscribedTopics = V2ApiTopics.map((topic) => {
    if (topic === 'app/prop' || topic === 'device/prop') {
        topic += '/#';
    }
    return `+/${topic}`;
});

export type V2ApiTopic = (typeof V2ApiTopics)[number];

export type V2BasePropertyValue = DataType;
export type V2UnpackedPropertyValue = Array<V2BasePropertyValue>

export type AnyV2MQTTPayload =
    | V2DeviceInfo
    | V2ApplicationInfo
    | V2PropertyRegistration
    | V2UnpackedPropertyValue
    | Buffer;

/**
 * Type Guard for API source definitions
 * @param {string} source - the source of the message. For example, device or app
 * @return  {boolean} if the source is valid
 */
export function isV2Source (source: string): source is V2Source {
    return V2Sources.includes(source as V2Source);
}
