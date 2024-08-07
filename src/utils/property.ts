import { AnySource, FormattedPropertyValue } from '../types';
import { exhaustiveGuard } from './usefulTS';
import { MqttPublishFunc, V2PacketParser } from '../mqttEventHandler';
import { IHardwareRegistrationCache } from '../hardwareRegistrationCache';

/**
 * Wrapper an Error if a property doesn't exist
 */
export class PropertyInvalidError extends Error {
    /**
     * @param {string} message - error message
     */
    constructor (message: string) {
        super(message);
    }
}

/**
 * Wrapper for property access errors
 */
export class PropertyAccessError extends Error {
    /**
     * @param {string} message - error message
     */
    constructor (message: string) {
        super(message);
    }
}

/**
 * Wrapper for property format errors
 *
 * Use for invalid length or format
 */
export class PropertyFormatError extends Error {
    /**
     * @param {string} message - error message
     */
    constructor (message: string) {
        super(message);
    }
}


/**
 * Publishes a formatted 'set' payload to the property topic on mqtt
 *
 * @param {IHardwareRegistrationCache} cache - hardware cache to get registration info
 * @param {string} componentId - the component to publish the update to
 * @param {AnySource} source - which source to publish the value to
 * @param {string} propertyPath - the name of the property to publish to
 * @param {FormattedProertyValue} values - the formatted value to publish to the hardware
 * @param {MqttPublishFunc} mqttPublishFunc - mqtt publish function to use (could throw an error)
 */
export const setPropertyValue = async (cache: IHardwareRegistrationCache, componentId: string, source: AnySource, propertyPath: string, values: FormattedPropertyValue, mqttPublishFunc: MqttPublishFunc) => {
    const propertyRegistration = await cache.getProperty(componentId, source, propertyPath);
    const apiVersion = await cache.getMQTTAPIVersion(componentId);

    // check for null or undefined registration or api version. Need both to publish
    if (propertyRegistration == null || apiVersion == null) {
        throw new PropertyInvalidError(`[componentId: ${componentId}, source: ${source} propertyPath: ${propertyPath}], is not a valid property`);
    }

    if (propertyRegistration.settable !== true) {
        throw new PropertyAccessError(`[componentId: ${componentId}, source: ${source} propertyPath: ${propertyPath}], is not settable`);
    }

    switch (apiVersion) {
        case 2:
        {
            const parser = new V2PacketParser();
            await parser.setPropertyValue(componentId, source, propertyRegistration, values, mqttPublishFunc);
            break;
        }
        default:
            exhaustiveGuard(apiVersion);
    }
};
