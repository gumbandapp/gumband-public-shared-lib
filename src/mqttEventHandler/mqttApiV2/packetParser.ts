

import { isNativeError } from 'util/types';

import Long from 'long';
import struct, { DataType } from 'python-struct';
import { GMBND_COLOR_FORMAT, GMBND_LED_FORMAT } from '.';
import { V2ApiVersion, V2ApiVersions, V2ApplicationInfo, V2BasePropertyValue, V2JsonExtendedPropertyValue, V2JsonPropertyValue, V2Log, V2Platform, V2PropertyFormat, V2PropertyFormatInfo, V2PropertyRegistration, V2PropertyType, V2PropertyTypes, V2SystemInfo, V2SystemType, V2SystemTypes, V2UnpackedPropertyValue } from '../../types';
import { exhaustiveGuard } from '../../utils/usefulTS';


/*
This regex is based on the spec from the node package that we intend to use for packing and unpacking property payloads: https://github.com/danielgindi/node-python-struct/blob/master/src/core.js#L4
Can be read as:
"Start of the string, optional first char to describe size & alignment, one or many groups of (optional decimal value followed by one of the format chars), end of string"

Note: this does not match empty format strings, which should be considered valid.
*/
const PROPERTY_FORMAT_REGEX = /^[@=!<>]?([1-9]?[xcbBhHiIlLfdspPqQ?])+$/;
const PROPERTY_FORMAT_STRING_REGEX = /^[@=!<>]?(s)+$/;
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const INVALID_PROPERTY_PATH_CHARS = /[^\x20-\x22\x25-\x2A\x2C-\x7E]/; // Negated set of all printable characters except #, $, + and <DEL> (see: https://web.itu.edu.tr/sgunduz/courses/mikroisl/ascii.html)

/**
 * V2PacketParser class.
 * This class will contains validation methods for the MQTT API Version 2
 */
export class V2PacketParser {
    /**
     * This function attempts to decode a Buffer payload into a V2 system info payload.
     *
     * @param {Buffer} payload - Buffer object that is expected to be a System Info packet that's been JSON encoded and then utf-8 encoded
     * @return {Promise<V2SystemInfo>} Promise object that should return the payload as a JS Object. Removing fields that we do not expect.
     * @throws {Error} if an error occurs in parsing
     */
    async parseSystemInfo (payload: Buffer): Promise<V2SystemInfo> {
        console.log('MqttApiV2Parser.parseSystemInfo()');
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

        console.debug('Received system info:', jsonPayload);
        return this.validateSystemInfo(jsonPayload);
    }

    /**
     * Validates a V2SystemInfo object
     *
     * @param {V2SystemInfo} v2SystemInfo - The incoming hardware data
     */
    async validateSystemInfo (v2SystemInfo: V2SystemInfo): Promise<V2SystemInfo> {
        await Promise.all([
            this.validateApiVersion(v2SystemInfo.api_ver),
            new Promise((resolve) => {
                if (v2SystemInfo.gb_lib_ver !== undefined) {
                    return resolve(this.validateGumbandLibraryVersion(v2SystemInfo.gb_lib_ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (v2SystemInfo.name !== undefined) {
                    return resolve(this.validateSystemName(v2SystemInfo.name));
                }
                return resolve(undefined);
            }),
            this.validateSystemType(v2SystemInfo.type),
            this.validateCapabilities(v2SystemInfo.capabilities),
            new Promise((resolve) => {
                if (v2SystemInfo.platform !== undefined) {
                    return resolve(this.validatePlatform(v2SystemInfo.platform));
                }
                return resolve(undefined);
            }),
            this.validateMACAddress(v2SystemInfo.mac),
            this.validateIP(v2SystemInfo.ip),
            this.validateNumProps(v2SystemInfo.num_props),
            new Promise((resolve) => {
                const v2SystemInfoFields: Record<keyof V2SystemInfo, true> = {
                    api_ver: true,
                    gb_lib_ver: true,
                    name: true,
                    type: true,
                    capabilities: true,
                    num_props: true,
                    platform: true,
                    mac: true,
                    ip: true,
                };

                for (const key of Object.keys(v2SystemInfo)) {
                    if (!v2SystemInfoFields[key as keyof V2SystemInfo]) {
                        console.debug(`Deleted extra key ${key} from System Info`);
                        delete v2SystemInfo[key as keyof V2SystemInfo];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return v2SystemInfo as V2SystemInfo;
    }

    /**
     * Validates an mqtt api version
     *
     * @param {number} mqttApiVersion - unvalidated api version
     * @return {V2ApiVersion} - validated api version
     */
    async validateApiVersion (mqttApiVersion: number): Promise<V2ApiVersion> {
        if (typeof mqttApiVersion !== 'number') {
            throw new Error('api version is not a number');
        }
        if (mqttApiVersion !== 2) {
            throw new Error(`api version is invalid. expected value: ${V2ApiVersions}`);
        }
        return mqttApiVersion as V2ApiVersion;
    }

    /**
     * Validates gumband library version
     * @param {string} gumbandLibVer - unvalidated version
     * @return {string} - validated version
     */
    async validateGumbandLibraryVersion (gumbandLibVer: string): Promise<string> {
        if (typeof gumbandLibVer !== 'string') {
            throw new Error('gumband library version is not a string');
        }
        return gumbandLibVer;
    }

    /**
     * Validates the system type
     *
     * System type value must be one that we expect that we expect
     * @param {V2SystemType} systemType - unvalidated system type
     * @return {V2SystemType} - validated
     */
    async validateSystemType (systemType: V2SystemType): Promise<V2SystemType> {
        if (typeof systemType !== 'string') {
            throw new Error('system type not a string');
        }
        if (!V2SystemTypes.includes(systemType as V2SystemType)) {
            throw new Error(`invalid system type. expected types: [${V2SystemTypes.join(', ')}]`);
        }
        return systemType as V2SystemType;
    }

    /**
     * Validates capabilities
     *
     * Each capability must be a string
     * @param {Array<string>} capabilities - unvalidated capabilities
     * @return {Array<string>} - validated capabilities
     */
    async validateCapabilities (capabilities: Array<string>): Promise<Array<string>> {
        if (!Array.isArray(capabilities)) {
            throw new Error('capabilities are not an array');
        }

        capabilities.forEach((capability: string) => {
            if (!(typeof capability === 'string')) {
                throw new Error(`capability: ${capability} is not a string`);
            }
        });

        return capabilities;
    }

    /**
     * Validates a name
     * @param {string} name - unvalidated name
     * @return {string} - validated name
     */
    async validateSystemName (name: string): Promise<string> {
        if (typeof name !== 'string') {
            throw new Error('name is not a string');
        }

        return name;
    }

    /**
     * Validates a MAC address
     *
     * MAC address must match the MAC_ADDRESS_REGEX
     * @param {string} mac - unvalidated MAC address
     * @return {string} - validated MAC address
     */
    async validateMACAddress (mac: string): Promise<string> {
        if (typeof mac !== 'string') {
            throw new Error('mac is not a string');
        }
        if (!MAC_ADDRESS_REGEX.test(mac)) {
            throw new Error('mac is not a valid MAC Address');
        }
        return mac;
    }

    /**
     * Validates an IP address
     *
     * IP address must match the IP_V4_ADDRESS_REGEX
     * @param {string} ip - unvalidated IP address
     * @return {string} - validated IP address
     */
    async validateIP (ip: string): Promise<string> {
        if (typeof ip !== 'string') {
            throw new Error('ip not a string');
        }
        const octetArray = ip.split('.');
        if (octetArray.length !== 4) {
            throw new Error('ip is invalid format');
        }
        const octetRegex = /^(([1-9][0-9]?)?[0-9])$/; // any integer in [0, 999] without a leading zero. (ie. '0', '1'... are valid, but '00', '01'... are invalid)
        octetArray.forEach((octet) => {
            if (!octetRegex.test(octet)) {
                throw new Error(`ip value ${octet} is invalid`);
            }
            if (parseInt(octet) > 255) {
                throw new Error(`ip value ${octet} is out of bounds`);
            }
        });
        return ip;
    }

    /**
     * Validates meta data (V2SystemInfo.platform)
     * @param {V2Platform} platform - unvalidated platform
     * @return {V2Platform} - validated platform
     */
    async validatePlatform (platform: V2Platform): Promise<V2Platform> {
        await Promise.all([
            this.validatePlatformName(platform.name),
            new Promise((resolve) => {
                if (platform.variant !== undefined) {
                    return resolve(this.validatePlatformVariant(platform.variant));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (platform.ver !== undefined) {
                    return resolve(this.validatePlatformVersion(platform.ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (platform.gb_pkg_ver !== undefined) {
                    return resolve(this.validateGumbandPackageVersion(platform.gb_pkg_ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (platform.bootloader_ver !== undefined) {
                    return resolve(this.validatePlatformBootloaderVersion(platform.bootloader_ver));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                const v2PlatformFields: Record<keyof V2Platform, true> = {
                    name: true,
                    variant: true,
                    ver: true,
                    gb_pkg_ver: true,
                    bootloader_ver: true,
                };

                for (const key of Object.keys(platform)) {
                    if (!v2PlatformFields[key as keyof V2Platform]) {
                        console.debug(`Deleted extra key ${key} from System platform`);
                        delete platform[key as keyof V2Platform];
                    }
                }
                return resolve(undefined);
            }),
        ]);

        return platform as V2Platform;
    }

    /**
     * Validates platform name (V2SystemInfo.platform.name)
     * @param {string} name - unvalidated platform name
     * @return {string} - validated platform name
     */
    async validatePlatformName (name: string): Promise<string> {
        if (typeof name !== 'string') {
            throw new Error('platform name is not a string');
        }
        return name;
    }

    /**
     * Validates platform variant (V2SystemInfo.platform.variant)
     * @param {string} variant - unvalidated variant
     * @return {string} - validated variant
     */
    async validatePlatformVariant (variant: string): Promise<string> {
        if (typeof variant !== 'string') {
            throw new Error('platform variant is not a string');
        }
        return variant;
    }

    /**
     * Validates platform version (V2SystemInfo.platform.ver)
     * @param {string} version - unvalidated version
     * @return {string} - validated version
     */
    async validatePlatformVersion (version: string): Promise<string> {
        if (typeof version !== 'string') {
            throw new Error('platform version is not a string');
        }
        return version;
    }

    /**
     * Validates platform bootloader version (V2SystemInfo.platform.bootloader_ver)
     * @param {string} bootloaderVersion - unvalidated bootloader version
     * @return {string} - validated bootloader version
     */
    async validatePlatformBootloaderVersion (bootloaderVersion: string): Promise<string> {
        if (typeof bootloaderVersion !== 'string') {
            throw new Error('platform bootloader version is not a string');
        }
        return bootloaderVersion;
    }

    /**
     * Validates Gumband Package Version (V2SystemInfo.platform.gb_pkg_ver and V2ApplicationInfo.gb_pkg_ver)
     * @param {string} gumbandPackageVersion - unvalidated gumband package version
     * @return {string} - validated gumband package version
     */
    async validateGumbandPackageVersion (gumbandPackageVersion: string): Promise<string> {
        if (typeof gumbandPackageVersion !== 'string') {
            throw new Error('gumband package version is not a string');
        }
        return gumbandPackageVersion;
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
            new Promise((resolve) => {
                if (appInfo.file_name !== undefined) {
                    return resolve(this.validateAppFileName(appInfo.file_name));
                }
                return resolve(undefined);
            }),
            new Promise((resolve) => {
                if (appInfo.ver !== undefined) {
                    return resolve(this.validateAppVersion(appInfo.ver));
                }
                return resolve(undefined);
            }),
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
     * This function attempts to decode a Buffer payload into a V2Log object.
     * @param {Buffer} payload - Buffer object that is expected to be an V2Log packet that's been JSON encoded and then utf-8 encoded
     * @return {Promise<V2Log>}
     */
    async parseLog (payload: Buffer): Promise<V2Log> {
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

        console.debug('Received log:', jsonPayload);
        return this.validateLog(jsonPayload);
    }

    /**
     * This function validates the properties of a new log
     * @param {V2Log} log - the log packet to validate
     * @return {V2Log} the parsed log
     */
    validateLog (log: V2Log): V2Log {
        if (log.severity === undefined) {
            throw new Error('log severity must be declared');
        }
        if (!['debug', 'error', 'warning'].includes(log.severity)) {
            throw new Error('log severity must be of a known level');
        }
        if (typeof log.text !== 'string') {
            throw new Error('log message must be a string');
        }

        return log as V2Log;
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
     * Validates that a unpacked single value falls within expected boundaries
     *
     * @param {V2UnpackedPropertyValue} values - parsed value
     * @param {V2PropertyRegistration} propertyRegistration - the registration information for the property
     * @return {V2BasePropertyValue} value - the value that falls between ranges
     */
    validatePropertyValueBoundaries (values: V2BasePropertyValue, propertyRegistration: V2PropertyRegistration ): V2BasePropertyValue {
        try {
            switch (propertyRegistration.type) {
                case 'gmbnd_primitive':
                    values.forEach((value) => {
                        if (typeof value === 'number') {
                            if ( propertyRegistration.min !== undefined && value<propertyRegistration.min ) {
                                throw new Error(`Property value falls below expected minimum of ${propertyRegistration.min}`);
                            }
                            if ( propertyRegistration.max !== undefined && value>propertyRegistration.max ) {
                                throw new Error(`Property value falls above expected maximum of ${propertyRegistration.max}`);
                            }
                        } else if (Long.isLong(value)) {
                            if ( propertyRegistration.min !== undefined && value.compare(propertyRegistration.min) === -1) {
                                throw new Error(`Property value falls below expected minimum of ${propertyRegistration.min}`);
                            }
                            if ( propertyRegistration.max !== undefined && value.compare(propertyRegistration.max) === 1 ) {
                                throw new Error(`Property value falls above expected maximum of ${propertyRegistration.max}`);
                            }
                        }
                    });
                    break;
                case 'gmbnd_color':
                    this.validateExtendedPropertyValueBoundaries(values, GMBND_COLOR_FORMAT);
                    break;
                case 'gmbnd_led':
                    this.validateExtendedPropertyValueBoundaries(values, GMBND_LED_FORMAT);
                    break;
                default:
                    exhaustiveGuard(propertyRegistration.type);
            }
            return values;
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            throw new Error(e);
        }
    }

    /**
     * Function that validates boundraies for non-primative types
     *
     * @param {V2UnpackedPropertyValue} values - values to bounds check
     * @param {V2PropertyFormatInfo} propertyFormatting - detailed configuration on how to load property information
     */
    private validateExtendedPropertyValueBoundaries (values: V2BasePropertyValue, propertyFormatting: V2PropertyFormatInfo): void {
        if (values.length !== propertyFormatting.length) {
            throw new Error('Incorrect number of values provided for property type');
        }
        for (let i = 0; i<values.length; i++) {
            const value = values[i];
            const min = propertyFormatting[i].min;
            const max = propertyFormatting[i].max;
            if (typeof value === 'number') {
                if ( min !== undefined && value < min ) {
                    throw new Error(`Property value falls below expected minimum of ${min}`);
                }
                if ( max !== undefined && value > max ) {
                    throw new Error(`Property value falls above expected maximum of ${max}`);
                }
            } else if (Long.isLong(value)) {
                if ( min !== undefined && value.compare(min) === -1) {
                    throw new Error(`Property value falls below expected minimum of ${min}`);
                }
                if ( max !== undefined && value.compare(max) === 1 ) {
                    throw new Error(`Property value falls above expected maximum of ${max}`);
                }
            }
        }
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
                // This doesn't handle the empty string case very well, so we'll just special case it
                if (payload.length === 0) {
                    return [['']];
                }

                const stringBufferLen = Math.min(propertyRegistration.length, payload.length);
                formatString = String(stringBufferLen) + propertyRegistration.format;
            }

            // Unpack iteratively
            // It might be worth creating a PR to add this to the upstream npm package since this is basically the same behavior as iter_unpack() in the python implementation.
            const itemSize = struct.sizeOf(formatString);
            let itemIndex = 0;
            let bufferIndex = 0;
            while (itemIndex < propertyRegistration.length && (bufferIndex + itemSize) <= payload.length) {
                const unpackedItem = struct.unpackFrom(formatString, payload, false, bufferIndex) as unknown as V2BasePropertyValue;
                this.validatePropertyValueBoundaries(unpackedItem, propertyRegistration);
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

    /**
     *
     * @param {V2UnpackedPropertyValue} value - unpacked property to be formatted
     * @param {propertyRegistration} propertyRegistration - registration information on property
     * @return {V2JsonPropertyValue} - the formatted json blob with property information
     */
    jsonFormatPropertyValue (value: V2UnpackedPropertyValue, propertyRegistration: V2PropertyRegistration): V2JsonPropertyValue {
        try {
            switch (propertyRegistration.type) {
                case 'gmbnd_primitive':
                    // eslint-disable-next-line no-case-declarations
                    const primativeArray: V2BasePropertyValue = [];
                    value.forEach((val) => {
                        val.forEach((v)=> {
                            primativeArray.push(v);
                        });
                    });
                    return primativeArray;
                case 'gmbnd_color':
                    return value.map((val) => {
                        return this.formatExtendedPropertyValue(val, GMBND_COLOR_FORMAT);
                    });
                case 'gmbnd_led':
                    return value.map((val) => {
                        return this.formatExtendedPropertyValue(val, GMBND_LED_FORMAT);
                    });
                default:
                    exhaustiveGuard(propertyRegistration.type);
            }
            // Because the default case above throws an error, we will never get here
            throw new Error('Unable to JSON format property value');
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            throw new Error(e);
        }
    }

    /**
     * Function that pretty prints a json given an extended definition of the property format
     *
     * @param {V2BasePropertyValue} value - value to pretty print
     * @param {V2PropertyFormatInfo} propertyFormatting - detailed configuration on how to load property information
     * @return {V2JsonExtendedPropertyValue} formatted property
     */
    private formatExtendedPropertyValue (value: V2BasePropertyValue, propertyFormatting: V2PropertyFormatInfo): V2JsonExtendedPropertyValue {
        if (value.length !== propertyFormatting.length) {
            throw new Error('Incorrect number of values provided for JSON formatting');
        }
        const formattedProperty: V2JsonExtendedPropertyValue = {};
        for (let i = 0; i<value.length; i++) {
            formattedProperty[propertyFormatting[i].name] = value[i];
        }
        return formattedProperty;
    }

    /**
     *
     * @param {V2JsonPropertyValue} value - unpacked property to be formatted
     * @param {propertyRegistration} propertyRegistration - registration information on property
     * @return {V2BasePropertyValue} - the formatted json blob with property information
     */
    public unpackJsonPropertyValue (value: V2JsonPropertyValue, propertyRegistration: V2PropertyRegistration): V2UnpackedPropertyValue {
        const unpackedDataArr: V2UnpackedPropertyValue = [];
        let customDataFormat: V2PropertyFormatInfo | undefined = undefined;
        switch (propertyRegistration.type) {
            case 'gmbnd_primitive':
                if (PROPERTY_FORMAT_STRING_REGEX.test(propertyRegistration.format) && typeof value[0] === 'string') {
                    // We expect 's' format props to only have a single string in the array
                    // Truncate to registered length if value is too long
                    if (value[0].length > propertyRegistration.length) {
                        return [[value[0].substring(0, propertyRegistration.length)]];
                    } else {
                        return [[value[0]]];
                    }
                }

                for (let i = 0; i < propertyRegistration.length && value.length; i++) {
                    unpackedDataArr.push([value[i] as DataType]);
                }

                return unpackedDataArr;
            case 'gmbnd_color':
                customDataFormat = GMBND_COLOR_FORMAT;
                break;
            case 'gmbnd_led':
                customDataFormat = GMBND_LED_FORMAT;
                break;
            default:
                exhaustiveGuard(propertyRegistration.type);
        }
        if (customDataFormat===undefined) {
            // fallback, parse best we can
            value.forEach((subValue)=>{
                unpackedDataArr.push(Object.values(subValue));
            });
        } else {
            value.forEach((subValue) => {
                // typescript wanted this checked
                if (typeof subValue === 'object' && subValue !== null && !Long.isLong(subValue) && customDataFormat) {
                    const subArr: V2BasePropertyValue = [];
                    customDataFormat.forEach((format) => {
                        subArr.push(subValue[format.name]);
                    });
                    unpackedDataArr.push(subArr);
                } else {
                    throw new Error('Error reading in data');
                }
            });
        }

        return unpackedDataArr;
    }

    /**
     * Packs a property value to be sent to MQTT
     *
     * @param {string} format - string format for the property
     * @param {V2UnpackedPropertyValue} values - the list of property value
     * @return {Buffer} the buffer packed from provided values
     */
    public packPropertyValue (format: string, values: V2UnpackedPropertyValue): Buffer {
        if (PROPERTY_FORMAT_STRING_REGEX.test(format)) {
            // In this case, we assume that a single string is wrapped in a 2D array
            const value = values[0][0];
            const sIndex = format.indexOf('s');
            if (typeof value !== 'string') {
                throw new TypeError('values[0][0] is not a string');
            }
            const length = value.length;
            format = format.substring(0, sIndex) + String(length) + format.substring(sIndex);
            values = [[value]];
        }
        return Buffer.concat(values.map((value: Array<DataType>) => {
            return struct.pack(format, value);
        }));
    }
}
