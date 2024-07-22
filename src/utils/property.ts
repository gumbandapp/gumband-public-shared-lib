import { MqttClient } from 'mqtt/*';
import { AnySource, ApiVersion, v2PropSetEndpoint } from '../types';
import { exhaustiveGuard } from './usefulTS';


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
export const publishApplicationValue = async (client: MqttClient, componentId: string, propertyPath: string, value: Buffer, source: AnySource, apiVersion: ApiVersion) => {
    switch (apiVersion) {
        case 2:
            await new Promise<void>((resolve, reject) => {
                client.publish(v2PropSetEndpoint(componentId, propertyPath, source), value, (error?: Error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            break;
        default:
            exhaustiveGuard(apiVersion);
    }
};
