import { isNativeError } from 'util/types';
import type {
    V2ApiVersion,
    V2ApplicationInfo,
    V2DeviceInfo,
    V2DeviceMetadata,
    V2DeviceType,
    V2PropertyFormat,
    V2PropertyRegistration,
    V2PropertyType,
    V2UnpackedPropertyValue,
} from '../../types';
import {
    V2ApiVersions,
    V2DeviceTypes,
    V2PropertyTypes,
} from '../../types';

import struct from 'python-struct';

/*
This regex is based on the spec from the node package that we intend to use for packing and unpacking property payloads: https://github.com/danielgindi/node-python-struct/blob/master/src/core.js#L4
Can be read as:
"Start of the string, optional first char to describe size & alignment, one or many groups of (optional decimal value followed by one of the format chars), end of string"

Note: this does not match empty format strings, which should be considered valid.
*/
const PROPERTY_FORMAT_REGEX = /^[@=!<>]?([1-9]?[xcbBhHiIlLfdspPqQ?])+$/;
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const INVALID_PROPERTY_PATH_CHARS = /[^\x20-\x22\x25-\x2A\x2C-\x7E]/; // Negated set of all printable characters except #, $, + and <DEL> (see: https://web.itu.edu.tr/sgunduz/courses/mikroisl/ascii.html)

/**
 * V2PacketParser class.
 * This class will contains validation methods for the MQTT API Version 2
 */
export class V2PacketParser {
    /**
     * This function attempts to decode a Buffer payload into a V2 device info payload.
     *
     * @param {Buffer} payload - Buffer object that is expected to be a Device Info packet that's been JSON encoded and then utf-8 encoded
     * @return {Promise<V2DeviceInfo>} Promise object that should return the payload as a JS Object. Removing fields that we do not expect.
     * @throws {Error} if an error occurs in parsing
     */
    async parseDeviceInfo (payload: Buffer): Promise<V2DeviceInfo> {
        console.log('MqttApiV2Parser.parseDeviceInfo()');
        let jsonPayload;
        try {
            const decodedPayload = payload.toString('utf-8');
            jsonPayload = JSON.parse(decodedPayload);
        } catch (e) {
            const message = 'Payload could not be JSON parsed';
            console.error(message);
            if (isNativeError(e)) {
                console.error(e.message);
            }
            throw new Error(message);
        }

        console.debug('Received device info:', jsonPayload);
        return this.validateDeviceInfo(jsonPayload);
    }

    /**
     * Validates a V2DeviceInfo object
     *
     * @param {V2DeviceInfo} v2DeviceInfo - The incoming hardware data
     */
    async validateDeviceInfo (v2DeviceInfo: V2DeviceInfo): Promise<V2DeviceInfo> {
        await Promise.all([
            this.validateDeviceApiVersion(v2DeviceInfo.api_ver),
            new Promise((resolve) => {
                if (v2DeviceInfo.name !== undefined) {
                    return resolve(this.validateDeviceName(v2DeviceInfo.name));
                }
                return resolve(undefined);
            }),
            this.validateDeviceType(v2DeviceInfo.type),
            this.validateDeviceCapabilities(v2DeviceInfo.capabilities),
            new Promise((resolve) => {
                if (v2DeviceInfo.device !== undefined) {
                    return resolve(this.validateDeviceMetadata(v2DeviceInfo.device));
                }
                return resolve(undefined);
            }),
            this.validateDeviceMACAddress(v2DeviceInfo.mac),
            this.validateDeviceIP(v2DeviceInfo.ip),
            this.validateNumProps(v2DeviceInfo.num_props),
            new Promise((resolve) => {
                const v2DeviceInfoFields: Record<keyof V2DeviceInfo, true> = {
                    api_ver: true,
                    name: true,
                    type: true,
                    capabilities: true,
                    device: true,
                    mac: true,
                    ip: true,
                    num_props: true,
                };

                for (const key of Object.keys(v2DeviceInfo)) {
                    if (!v2DeviceInfoFields[key as keyof V2DeviceInfo]) {
                        console.debug(`Deleted extra key ${key} from Device Info`);
                        delete v2DeviceInfo[key as keyof V2DeviceInfo];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return v2DeviceInfo as V2DeviceInfo;
    }

    /**
     * Validates an mqtt api version
     *
     * @param {number} mqttApiVersion - unvalidated api version
     * @return {V2ApiVersion} - validated api version
     */
    async validateDeviceApiVersion (mqttApiVersion: number): Promise<V2ApiVersion> {
        if (typeof mqttApiVersion !== 'number') {
            throw new Error('api version is not a number');
        }
        if (mqttApiVersion !== 2) {
            throw new Error(`api version is invalid. expected value: ${V2ApiVersions}`);
        }
        return mqttApiVersion as V2ApiVersion;
    }

    /**
     * Validates a device type
     *
     * Device type value must be one that we expect that we expect
     * @param {V2DeviceType} deviceType - unvalidated device type
     * @return {V2DeviceType} - validated
     */
    async validateDeviceType (deviceType: V2DeviceType): Promise<V2DeviceType> {
        if (typeof deviceType !== 'string') {
            throw new Error('device type not a string');
        }
        if (!V2DeviceTypes.includes(deviceType as V2DeviceType)) {
            throw new Error(`invalid device type. expected types: [${V2DeviceTypes.join(', ')}]`);
        }
        return deviceType as V2DeviceType;
    }

    /**
     * Validates device capabilities
     *
     * Each device capability must be a string
     * @param {Array<string>} deviceCapabilities - unvalidated device capabilities
     * @return {Array<string>} - validated device capabilities
     */
    async validateDeviceCapabilities (deviceCapabilities: Array<string>): Promise<Array<string>> {
        if (!Array.isArray(deviceCapabilities)) {
            throw new Error('device capabilities are not an array');
        }

        deviceCapabilities.forEach((capability: string) => {
            if (!(typeof capability === 'string')) {
                throw new Error(`device capability: ${capability} is not a string`);
            }
        });

        return deviceCapabilities;
    }

    /**
     * Validates a device name
     * @param {string} deviceName - unvalidated device name
     * @return {string} - validated device name
     */
    async validateDeviceName (deviceName: string): Promise<string> {
        if (typeof deviceName !== 'string') {
            throw new Error('device name is not a string');
        }

        return deviceName;
    }

    /**
     * Validates a MAC address
     *
     * MAC address must match the MAC_ADDRESS_REGEX
     * @param {string} deviceMAC - unvalidated MAC address
     * @return {string} - validated MAC address
     */
    async validateDeviceMACAddress (deviceMAC: string): Promise<string> {
        if (typeof deviceMAC !== 'string') {
            throw new Error('device mac is not a string');
        }
        if (!MAC_ADDRESS_REGEX.test(deviceMAC)) {
            throw new Error('device mac is not a valid MAC Address');
        }
        return deviceMAC;
    }

    /**
     * Validates an IP address
     *
     * IP address must match the IP_V4_ADDRESS_REGEX
     * @param {string} deviceIP - unvalidated IP address
     * @return {string} - validated IP address
     */
    async validateDeviceIP (deviceIP: string): Promise<string> {
        if (typeof deviceIP !== 'string') {
            throw new Error('device ip not a string');
        }
        const octetArray = deviceIP.split('.');
        if (octetArray.length !== 4) {
            throw new Error('device ip is invalid format');
        }
        const octetRegex = /^(([1-9][0-9]?)?[0-9])$/; // any integer in [0, 999] without a leading zero. (ie. '0', '1'... are valid, but '00', '01'... are invalid)
        octetArray.forEach((octet) => {
            if (!octetRegex.test(octet)) {
                throw new Error(`device ip value ${octet} is invalid`);
            }
            if (parseInt(octet) > 255) {
                throw new Error(`device ip value ${octet} is out of bounds`);
            }
        });
        return deviceIP;
    }

    /**
     * Validates device meta data (V2DeviceInfo.device)
     * @param {V2DeviceMetadata} deviceMetadata - unvalidated device metadata
     * @return {V2DeviceMetadata} - validated device metadata
     */
    async validateDeviceMetadata (deviceMetadata: V2DeviceMetadata): Promise<V2DeviceMetadata> {
        await Promise.all([
            this.validateDeviceMetadataPlatform(deviceMetadata.platform),
            this.validateDeviceMetadataVariant(deviceMetadata.variant),
            new Promise((resolve) => {
                if (deviceMetadata.ver !== undefined) {
                    return resolve(this.validateDeviceMetadataVersion(deviceMetadata.ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (deviceMetadata.gb_pkg_ver !== undefined) {
                    return resolve(this.validateGumbandPackageVersion(deviceMetadata.gb_pkg_ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (deviceMetadata.bootloader_ver !== undefined) {
                    return resolve(this.validateDeviceMetadataBootloaderVersion(deviceMetadata.bootloader_ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                const v2DeviceMetadataFields: Record<keyof V2DeviceMetadata, true> = {
                    platform: true,
                    variant: true,
                    ver: true,
                    gb_pkg_ver: true,
                    bootloader_ver: true,
                };

                for (const key of Object.keys(deviceMetadata)) {
                    if (!v2DeviceMetadataFields[key as keyof V2DeviceMetadata]) {
                        console.debug(`Deleted extra key ${key} from Device Metadata`);
                        delete deviceMetadata[key as keyof V2DeviceMetadata];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return deviceMetadata as V2DeviceMetadata;
    }

    /**
     * Validates device platform (V2DeviceInfo.device.platform)
     * @param {string} platform - unvalidated platform
     * @return {string} - validated platform
     */
    async validateDeviceMetadataPlatform (platform: string): Promise<string> {
        if (typeof platform !== 'string') {
            throw new Error('device platform is not a string');
        }
        return platform;
    }

    /**
     * Validates device platform variant (V2DeviceInfo.device.variant)
     * @param {string} variant - unvalidated variant
     * @return {string} - validated variant
     */
    async validateDeviceMetadataVariant (variant: string): Promise<string> {
        if (typeof variant !== 'string') {
            throw new Error('device variant is not a string');
        }
        return variant;
    }

    /**
     * Validates device platform version (V2DeviceInfo.device.ver)
     * @param {string} version - unvalidated version
     * @return {string} - validated version
     */
    async validateDeviceMetadataVersion (version: string): Promise<string> {
        if (typeof version !== 'string') {
            throw new Error('device version is not a string');
        }
        return version;
    }

    /**
     * Validates device bootloader version (V2DeviceInfo.device.bootloader_ver)
     * @param {string} bootloaderVersion - unvalidated bootloader version
     * @return {string} - validated bootloader version
     */
    async validateDeviceMetadataBootloaderVersion (bootloaderVersion: string): Promise<string> {
        if (typeof bootloaderVersion !== 'string') {
            throw new Error('device bootloader version is not a string');
        }
        return bootloaderVersion;
    }

    /**
     * Validates Gumband Package Version (V2DeviceInfo.device.gb_pkg_ver and V2ApplicationInfo.gb_pkg_ver)
     * @param {string} deviceSupportVersion - unvalidated gumband package version
     * @return {string} - validated gumband package version
     */
    async validateGumbandPackageVersion (deviceSupportVersion: string): Promise<string> {
        if (typeof deviceSupportVersion !== 'string') {
            throw new Error('gumband package version is not a string');
        }
        return deviceSupportVersion;
    }

    /**
     * This function attempts to decode a Buffer payload into a V2 application info payload.
     * @param {Buffer} payload - Buffer object that is expected to be an Application Info packet that's been JSON encoded and then utf-8 encoded
     * @return {Promise<V2ApplicationInfo>}
     */
    async parseApplicationInfo (payload: Buffer): Promise<V2ApplicationInfo> {
        console.log('MqttApiV2Parser.parseApplicationInfo()');
        let jsonPayload;
        try {
            const decodedPayload = payload.toString('utf-8');
            jsonPayload = JSON.parse(decodedPayload);
        } catch (e) {
            const message = `Payload could not be JSON parsed: ${payload}`;
            console.error(message);
            if (isNativeError(e)) {
                console.error(e.message);
            }
            throw new Error(message);
        }

        console.debug('Received app info:', jsonPayload);
        return this.validateApplicationInfo(jsonPayload);
    }

    /**
     * Validates a V2ApplicationInfo object
     *
     * @param {object} appInfo - The incoming hardware data
     * @return {Promise<V2ApplicationInfo>}
     */
    async validateApplicationInfo (appInfo: V2ApplicationInfo): Promise<V2ApplicationInfo> {
        await Promise.all([
            this.validateAppVersion(appInfo.ver),
            this.validateAppFileName(appInfo.file_name),
            new Promise((resolve) => {
                if (appInfo.gb_pkg_ver !== undefined) {
                    return resolve(this.validateGumbandPackageVersion(appInfo.gb_pkg_ver));
                }
                return resolve(undefined);
            }),
            this.validateNumProps(appInfo.num_props),
            new Promise((resolve) => {
                const v2AppInfoFields: Record<keyof V2ApplicationInfo, true> = {
                    ver: true,
                    file_name: true,
                    gb_pkg_ver: true,
                    num_props: true,
                };

                for (const key of Object.keys(appInfo)) {
                    if (!v2AppInfoFields[key as keyof V2ApplicationInfo]) {
                        console.debug(`Deleted extra key ${key} from App Info`);
                        delete appInfo[key as keyof V2ApplicationInfo];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return appInfo as V2ApplicationInfo;
    }

    /**
     * Validates an application version
     * @param {string} appVersion - unvalidated application version
     * @return {string} - validated application version
     */
    async validateAppVersion (appVersion: string): Promise<string> {
        if (typeof appVersion !== 'string') {
            throw new Error('app version is not a string');
        }
        return appVersion;
    }

    /**
     * Validates an application file name
     * @param {string} fileName - unvalidated file name
     * @return {string} - validated file name
     */
    async validateAppFileName (fileName: string): Promise<string> {
        if (typeof fileName !== 'string') {
            throw new Error('app file name is not a string');
        }
        return fileName;
    }

    /**
     * Validates number of properties
     * @param {number} numProps - unvalidated properties count
     * @return {number} - validated properties count
     */
    async validateNumProps (numProps: number): Promise<number> {
        if (typeof numProps !== 'number') {
            throw new Error('num_props is not a number');
        }
        if (numProps < 0) {
            throw new Error('num_props is a negative value');
        }
        if (numProps % 1 !== 0) {
            throw new Error('num_props is not an integer');
        }
        return numProps;
    }

    /**
     * This function attempts to decode a Buffer payload into a V2PropertyRegistration object.
     * @param {Buffer} payload - Buffer object that is expected to be an Property Registration packet that's been JSON encoded and then utf-8 encoded
     * @return {Promise<V2PropertyRegistration>}
     */
    async parseProperty (payload: Buffer): Promise<V2PropertyRegistration> {
        console.log('MqttApiV2Parser.parseProperty()');
        let jsonPayload;
        try {
            const decodedPayload = payload.toString('utf-8');
            jsonPayload = JSON.parse(decodedPayload);
        } catch (e) {
            const message = `Payload could not be JSON parsed: ${payload}`;
            console.error(message);
            if (isNativeError(e)) {
                console.error(e.message);
            }
            throw new Error(message);
        }

        console.debug('Received property:', jsonPayload);
        return this.validateProperty(jsonPayload);
    }

    /**
     * Validates a V2PropertyRegistration object
     * @param {V2PropertyRegistration} prop - unvalidated property
     * @return {V2PropertyRegistration} - validated property
     */
    async validateProperty (prop: V2PropertyRegistration): Promise<V2PropertyRegistration> {
        await Promise.all([
            this.validatePropertyPath(prop.path),
            this.validatePropertyIndex(prop.index),
            new Promise((resolve) => {
                if (prop.desc !== undefined) {
                    return resolve(this.validatePropertyDescription(prop.desc));
                }
                return resolve(undefined);
            }),
            this.validatePropertyType(prop.type),
            new Promise((resolve) => {
                resolve(
                    this.validatePropertyLength(prop.length)
                        .then(async () => this.validatePropertyFormat(prop.format, prop.length)),
                );
            }),
            this.validateBoolean(prop.settable, 'settable'),
            this.validateBoolean(prop.gettable, 'gettable'),
            new Promise((resolve) => {
                if (prop.min !== undefined) {
                    return resolve(this.validatePropertyMinimumValue(prop.min));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (prop.max !== undefined) {
                    return resolve(this.validatePropertyMaximumValue(prop.max));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (prop.step !== undefined) {
                    return resolve(this.validatePropertyStepValue(prop.step));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (prop.ui_hidden !== undefined) {
                    return resolve(this.validateBoolean(prop.ui_hidden, 'ui_hidden'));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                const v2PropFields: Record<keyof V2PropertyRegistration, true> = {
                    path: true,
                    index: true,
                    desc: true,
                    type: true,
                    format: true,
                    length: true,
                    settable: true,
                    gettable: true,
                    min: true,
                    step: true,
                    max: true,
                    ui_hidden: true,
                };

                for (const key of Object.keys(prop)) {
                    if (!v2PropFields[key as keyof V2PropertyRegistration]) {
                        console.debug(`Deleted extra key ${key} from Property`);
                        delete prop[key as keyof V2PropertyRegistration];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return prop as V2PropertyRegistration;
    }

    /**
     * Validates a property topic
     * @param {string} path - unvalidated property topic
     * @return {string} - validated property topic
     */
    async validatePropertyPath (path: string): Promise<string> {
        if (typeof path !== 'string') {
            throw new Error('property path is not a string');
        }
        const pathLevels = path.split('/');
        pathLevels.forEach((level) => {
            if (level === '') {
                throw new Error('property path contains an empty level');
            }
        });
        if (INVALID_PROPERTY_PATH_CHARS.test(path) === true) {
            throw new Error('property path contains invalid characters');
        }
        return path;
    }

    /**
     * Validates a property index
     * @param {number} index - unvalidated property index
     * @return {number} - validated property index
     */
    async validatePropertyIndex (index: number): Promise<number> {
        if (typeof index !== 'number') {
            throw new Error('property index is not a number');
        }
        if (index < 0) {
            throw new Error('property index is a negative value');
        }
        if (index % 1 !== 0) {
            throw new Error('property index is a decimal value');
        }
        return index;
    }

    /**
     * Validates a property description
     * @param {string} description - unvalidated property description
     * @return {string} - validated property descriptions
     */
    async validatePropertyDescription (description: string): Promise<string> {
        if (typeof description !== 'string') {
            throw new Error('property description is not a string');
        }
        return description;
    }

    /**
     * Validates a property type
     * @param {V2PropertyType} type - unvalidated property type
     * @return {V2PropertyType} - validated property type
     */
    async validatePropertyType (type: V2PropertyType): Promise<V2PropertyType> {
        if (typeof type !== 'string') {
            throw new Error('property type is not a string');
        }

        if (!V2PropertyTypes.includes(type)) {
            throw new Error('not a supported property type');
        }

        return type as V2PropertyType;
    }

    /**
     * Validates property array length
     * @param {number} length - unvalidated property array length
     * @return {number} - validated property array length
     */
    async validatePropertyLength (length: number): Promise<number> {
        if (typeof length !== 'number') {
            throw new Error('property length is not a number');
        }
        if (length < 0) {
            throw new Error('property length is a negative value');
        }
        if (length % 1 !== 0) {
            throw new Error('property length is a decimal value');
        }
        return length;
    }

    /**
     * Validates property format
     *
     * This is the only property fields that has interdependencies with other fields: type and length
     *
     * It's important to ensure that those fields are validated before this method is called
     * @param {V2PropertyFormat} format - unvalidated property format
     * @param {number} length - validated property array length
     * @return {V2PropertyFormat} - validated property format
     */
    async validatePropertyFormat (format: V2PropertyFormat, length: number): Promise<V2PropertyFormat> {
        if (typeof format !== 'string') {
            throw new Error('property format is not a string');
        }

        if (!PROPERTY_FORMAT_REGEX.test(format) && format !== '') {
            throw new Error('property format is not a valid python struct string');
        }

        if (format === '' && length !== 0) {
            throw new Error('Empty property format does not allow for array support');
        }

        return format as V2PropertyFormat;
    }

    /**
     * Validates property maximum value -- ensures that it is a number
     *
     * The hardware team has requested that this field only be used to limit the range of enterable values in the UI.
     * Therefore, we do not need do compare this value with the format or the other limiting properties: min and step.
     *
     * Instead, if these three values are incompatible with each other, the user should only receive feedback on that
     * when they attempt to load or update the property in the UI.
     * @param {number} maximum - unvalidated property max value
     * @return {number} - validated property max value
     */
    async validatePropertyMaximumValue (maximum: number): Promise<number> {
        if (typeof maximum !== 'number') {
            throw new Error('property max is not a number');
        }
        return maximum;
    }

    /**
     * Validates property minimum value -- ensures that it is a number
     *
     * The hardware team has requested that this field only be used to limit the range of enterable values in the UI.
     * Therefore, we do not need do compare this value with the format or the other limiting properties: max and step.
     *
     * Instead, if these three values are incompatible with each other, the user should only receive feedback on that
     * when they attempt to load or update the property in the UI.
     * @param {number} minimum - unvalidated property min value
     * @return {number} - validated property min value
     */
    async validatePropertyMinimumValue (minimum: number): Promise<number> {
        if (typeof minimum !== 'number') {
            throw new Error('property min is not a number');
        }
        return minimum;
    }

    /**
     * Validates property step value -- ensures that it is a number
     *
     * The hardware team has requested that this field only be used to limit the range of enterable values in the UI.
     * Therefore, we do not need do compare this value with the format or the other limiting properties: max and min.
     *
     * Instead, if these three values are incompatible with each other, the user should only receive feedback on that
     * when they attempt to load or update the property in the UI.
     * @param {number} step - unvalidated property step value
     * @return {number} - validated property step value
     */
    async validatePropertyStepValue (step: number): Promise<number> {
        if (typeof step !== 'number') {
            throw new Error('property step is not a number');
        }
        return step;
    }

    /**
     * Validates a boolean primitive
     * @param {boolean} expectedBoolean - unvalidated boolean
     * @param {string} [fieldName] - field name to reference in the error message if the expectedBoolean is not a boolean
     * @return {boolean} - validated boolean
     */
    async validateBoolean (expectedBoolean: boolean, fieldName?: string): Promise<boolean> {
        if (typeof expectedBoolean !== 'boolean') {
            throw new Error(`${fieldName ? `${fieldName} is ` : ''}not a boolean`);
        }
        return expectedBoolean;
    }

    /**
     * Function that parses a buffer from a struct that it's given
     *
     * @param {Buffer} payload - the packed buffer that is the property value
     * @param {V2PropertyRegistration} propertyRegistration - the property registration info saved in the cachey
     * @return {V2UnpackedPropertyValue} - result of the unpack
     */
    parsePropertyValue (payload: Buffer, propertyRegistration: V2PropertyRegistration): V2UnpackedPropertyValue {
        const unpacked: V2UnpackedPropertyValue = [];
        try {
            let formatString = propertyRegistration.format;
            // The string packing is a bit weird, it can't be iteratively unpacked like the other types since "s", means a string of size 1
            if (propertyRegistration.type == 'gmbnd_primitive' && propertyRegistration.format.includes('s')) {
                const stringBufferLen = Math.min(propertyRegistration.length, payload.length);
                formatString = String(stringBufferLen) + propertyRegistration.format;
            }

            // Unpack iteratively
            // It might be worth creating a PR to add this to the upstream npm package since this is basically the same behavior as iter_unpack() in the python implementation.
            const itemSize = struct.sizeOf(formatString);
            let itemIndex = 0;
            let bufferIndex = 0;
            while (itemIndex < propertyRegistration.length && (bufferIndex + itemSize) <= payload.length) {
                const unpackedItem = struct.unpackFrom(formatString, payload, false, bufferIndex);
                unpacked.push(unpackedItem);
                bufferIndex += itemSize;
                itemIndex++;
            }
        } catch (e) {
            const message = `Payload could not be struct parsed: ${payload}`;
            console.error(message);
            if (isNativeError(e)) {
                console.error(e.message);
            }
            throw new Error(message);
        }
        return unpacked;
    }
}
