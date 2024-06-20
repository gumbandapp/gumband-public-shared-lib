export * from './mqtt-api-v2';
import type {
    AnyV2MQTTPayload,
    V2ApiVersion,
    V2ApplicationInfo,
    V2DeviceInfo,
    V2HardwareManifest,
    V2PropertyRegistration,
} from './mqtt-api-v2';
import {
    V2ApiSubscribedTopics,
    V2ApiTopics,
    V2ApiVersions,
    V2DeviceInfoTopic,
    V2PropertyTypes,
    V2Sources,
} from './mqtt-api-v2';

export const AllSources = [...V2Sources] as const;
export type AnySource = (typeof AllSources)[number];

/*
    These types are meant to be Agnostic to the API Version. When we introduce a V3 api, all of these will basically become:
    export type DeviceInfo= V2DeviceInfo | V3DeviceInfo;
 */
export type DeviceInfo = V2DeviceInfo;
export const AllApiVersions = [...V2ApiVersions] as const;
export type ApiVersion = V2ApiVersion;
export type ApplicationInfo = V2ApplicationInfo;
export type PropertyRegistration = V2PropertyRegistration;

export type HardwareManifest = V2HardwareManifest;

export const AllMQTTInitialRegistrationTopics = [V2DeviceInfoTopic] as const;
export type MQTTInitialRegistrationTopic = (typeof AllMQTTInitialRegistrationTopics)[number];
export const AllMQTTLastWillAndTestamentTopics = [V2DeviceInfoTopic] as const;
export type MQTTLastWillAndTestamentTopic = (typeof AllMQTTLastWillAndTestamentTopics)[number];

export const AllMQTTTopics = [...V2ApiTopics] as const;
export const AllSubscribedMQTTTopics = [...V2ApiSubscribedTopics];

export type AnyMQTTPayload = AnyV2MQTTPayload;

export const AllPropertyTypes = [...V2PropertyTypes] as const;
export type AnyPropertyType = (typeof AllPropertyTypes)[number];

/**
 * Type Guard for the ApiVersion
 * @param {number} version - version to check
 * @return {boolean} if the version is one of the defined API versions
 */
export function isApiVersion (version: number): version is ApiVersion {
    return AllApiVersions.includes(version as ApiVersion);
}

/**
 *  Validate a topic is an initial registration topic
 * @param {string} topic - topic to check
 * @return {boolean} if the topic is an initial registration topic
 */
export function isMQTTInitialRegistrationTopic (topic: string): topic is MQTTInitialRegistrationTopic {
    return AllMQTTInitialRegistrationTopics.includes(topic as MQTTInitialRegistrationTopic);
}
