import { MqttClient } from 'mqtt/*';
import struct, { DataType } from 'python-struct';
import { ApiVersion } from '../types';
import { exhaustiveGuard } from './usefulTS';
/**
 * Packs a property value to be sent to MQTT
 *
 * @param {string} format - string format for the property
 * @param {Array<Array<DataType>>} values - the list of property value
 * @return {Buffer} the buffer packed from provided values
 */
export const packPropertyValue = (format: string, values: Array<Array<DataType>>): Buffer => {
    if (format === 's') {
        // In this case, we assume that a single string is wrapped in a 2D array
        return Buffer.from(values[0][0].toString());
    }
    return Buffer.concat(values.map((value: Array<DataType>) => {
        return struct.pack(format, value);
    }));
};
/**
 * Publishes a packed payload to the property topic on mqtt
 *
 * @param {MqttClient} client - MQTT client to publish to
 * @param {string} componentId - the component to publish the update to
 * @param {string} propertyPath - the name of the property to publish to
 * @param {Buffer} value - the packed value to publish to the hardware
 * @param {string} source - which source to publish the value to
 * @param {ApiVersion} apiVersion - which version of the API to use
 */
export const publishApplicationValue = async (client: MqttClient, componentId: string, propertyPath: string, value: Buffer, source: string, apiVersion: ApiVersion) => {
    switch (apiVersion) {
        case 2:
            await client.publish(`${componentId}/${source}/prop/${propertyPath}/set`, value);
            break;
        default:
            exhaustiveGuard(apiVersion);
    }
};
