import type { DataType } from 'python-struct';
import { ObjectValues } from '../../utils';

export const V2ApiVersions = [2] as const;

export type V2ApiVersion = (typeof V2ApiVersions)[number];

export const V2SystemTypes = ['generic', 'presence'] as const;

export type V2SystemType = (typeof V2SystemTypes)[number];

export const V2Capabilities = ['OTA', 'identify', 'filesystem'] as const;

export type V2Capability = (typeof V2Capabilities)[number];

export type V2Platform = {
    name: string,
    variant?: string,
    ver?: string,
    gb_pkg_ver?: string,
    bootloader_ver?: string,
};

// TODO: add some comments regarding expected formats from the Confluence Doc
export interface V2SystemInfo {
    api_ver: V2ApiVersion,
    gb_lib_ver?: string,

    name: string,
    type: V2SystemType,
    capabilities: Array<V2Capability | string>,
    num_props: number,

    platform: V2Platform,

    mac: string,
    ip: string,
}

export type V2ApplicationInfo = {
    file_name?: string,
    ver?: string,
    gb_pkg_ver?: string,
    num_props: number,
};

// TODO: [long-term] migrate these hard-coded property types to db-stored configurable types
export const V2PropertyTypes = [
    'gmbnd_primitive',
    'gmbnd_color',
    'gmbnd_led',
] as const;

export const V2Sources = {
    SYSTEM: 'system',
    APP: 'app',
} as const;

export type V2Source = ObjectValues<typeof V2Sources>;

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

export type V2PropertiesByTopic = Record<string, V2PropertyRegistration>;

export interface V2SourceRegistrationCommonFields {
    properties: V2PropertiesByTopic,
    isRegistered: boolean,
}

export interface V2SystemRegistration extends V2SourceRegistrationCommonFields {
    info: V2SystemInfo,
}

export interface V2AppRegistration extends V2SourceRegistrationCommonFields {
    info: V2ApplicationInfo,
}

export type V2HardwareRegistration = {
    apiVersion: V2ApiVersion,
    system: V2SystemRegistration,
    app: V2AppRegistration,
};

interface V2ConnectionSummary {
    name: string,
    address: string,
    port: number,
    enabled: boolean,
    secure: boolean,
    static: boolean,
    prop_interact: boolean,
}

export type V2Connections = {
    servers: Array<V2ConnectionSummary>
};

export interface V2ConnectionStatus extends V2ConnectionSummary {
    // TODO make the status value more explicit.
    status: number, // 1 indicates healthy connection, 0 or negative number corresponds to specific error code: 0 - not connected, -1 - can't find, -2 - bad auth, ...
    uptime: number,
}

export type V2ConnectionsStatus = {
    servers: Array<V2ConnectionStatus>
};

export const V2SystemInfoTopic = 'system/info' as const;

export const V2DeviceCommandTopic = 'device/command' as const;

export const V2ApiTopics = [
    V2SystemInfoTopic,
    'system/register/prop',
    'system/prop',
    'system/connections',
    'app/info',
    'app/register/prop',
    'app/prop',
] as const;


export const V2ApiSubscribedTopics = V2ApiTopics.map((topic) => {
    if (topic === 'app/prop' || topic === 'system/prop') {
        topic += '/#';
    }
    return `+/${topic}`;
});

export function V2PropGetEndpoint(componentId: string, propertyPath: string, source: V2Source): string {
    return `${componentId}/${source}/prop/get/${propertyPath}`;
}

export function V2PropSetEndpoint(componentId: string, propertyPath: string, source: V2Source): string {
    return `${componentId}/${source}/prop/set/${propertyPath}`;
}

export function V2PropPubEndpoint(componentId: string, propertyPath: string, source: V2Source): string {
    return `${componentId}/${source}/prop/pub/${propertyPath}`;
}

export function V2PropGetIndexedEndpoint(componentId: string, propertyPath: string, source: V2Source, indexExpr: string): string {
    return `${componentId}/${source}/prop/get/${indexExpr}/${propertyPath}`;
}

export function V2PropSetIndexedEndpoint(componentId: string, propertyPath: string, source: V2Source, indexExpr: string): string {
    return `${componentId}/${source}/prop/setn/${indexExpr}/${propertyPath}`;
}

export function V2PropPubIndexedEndpoint(componentId: string, propertyPath: string, source: V2Source, indexExpr: string): string {
    return `${componentId}/${source}/prop/pubn/${indexExpr}/${propertyPath}`;
}

export type V2ApiTopic = (typeof V2ApiTopics)[number];

export type V2BasePropertyValue = Array<DataType>;
export type V2UnpackedPropertyValue = Array<V2BasePropertyValue>
export type V2JsonPropertyValue = V2BasePropertyValue | Array<V2JsonExtendedPropertyValue>
export interface V2JsonExtendedPropertyValue {
    [key: string]: DataType,
}
// These types are used for both built in formatting, as well as non-primitive type value validation
export type V2PropertyFormatInfoBase = {
    name: string,
    min?: number,
    max?: number,
    step?: number,
}
export type V2PropertyFormatInfo = Array<V2PropertyFormatInfoBase>


export type AnyV2MQTTPayload =
    | V2SystemInfo
    | V2ApplicationInfo
    | V2PropertyRegistration
    | V2UnpackedPropertyValue
    | Buffer;

/**
 * Type Guard for API source definitions
 * @param {string} source - the source of the message. For example, system or app
 * @return  {boolean} if the source is valid
 */
export function isV2Source (source: string): source is V2Source {
    return Object.values(V2Sources).includes(source as V2Source);
}
