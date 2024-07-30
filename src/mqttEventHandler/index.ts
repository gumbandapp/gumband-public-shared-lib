export * from './common';
export * from './mqttApiV2';

import EventEmitter from 'events';
import mqtt from 'mqtt';
import { isNativeError } from 'util/types';
import { IHardwareRegistrationCache } from '../hardwareRegistrationCache';
import { ApiVersion, MQTTInitialRegistrationTopic, V2ApiTopic, V2SystemInfoTopic, isMQTTInitialRegistrationTopic } from '../types';
import { GbLogger } from '../utils/gbLogger';
import { exhaustiveGuard } from '../utils/usefulTS';
import { MqttApiV2 } from './mqttApiV2';

/**
 * MQTT Event Handler class - previously known as the Hardware Event Handler in the GBTT Service
 * - previously known as the Hardware Event Bus in the Hardware Service (lol)
 * As a base, this class is intended to live in both the cloud services and the Software Component SDK.
 *
 * If unique functionality is required for either code base (like storing parsed messages in a database), an extension
 * class should be written based on this class.
 *
 * Since both the SDK and the cloud service will require a cache for hardware registration, this class expects an
 * implementation of the IHardwareRegistrationCache Interface. As this class parses and validates messages, it uses the
 * interface methods to save and retrieve registration payloads in the cache.
 *
 * If more functionality is required, (such as database storage or forwarding payloads to other services), a new extension
 * to this class to handle those things.
 */
export class MQTTEventHandler extends EventEmitter {
    protected cache: IHardwareRegistrationCache;
    protected mqttV2Api: MqttApiV2;
    protected mqttClient: mqtt.MqttClient;
    protected logger: GbLogger;

    /**
     * Default Constructor
     * @param {IHardwareRegistrationCache} cache - Injected implementation of the IHardwareRegistrationCache interface
     * @param {mqtt.MqttClient} mqttClient - the mqtt client (used to publish messages back to the hardware)
     * @param {GbLogger} logger - the logger instance
     */
    constructor (cache: IHardwareRegistrationCache, mqttClient: mqtt.MqttClient, logger: GbLogger) {
        super();
        this.cache = cache;
        this.mqttClient = mqttClient;
        this.logger = logger;
        this.mqttV2Api = new MqttApiV2(cache, this.logger);
    }

    /**
     * Basic do nothing init, override if something needs to be waited on in the derived class
     */
    async init (): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Handle an MQTT message event
     *
     * @param {string} componentId - validated hardware id
     * @param {string} topic - published topic
     * @param {object} payload - published data
     */
    async onMessage (componentId: string, topic: string, payload: Buffer): Promise<void> {
        let apiVersion: ApiVersion | undefined;

        try {
            apiVersion = await this.cache.getMQTTAPIVersion(componentId);
        } catch (e) {
            const message = `Unable to get MQTT API Version from cache for componentId: ${componentId}`;
            this.logger.error(message);
            this.logger.error(`Payload: ${JSON.stringify(payload)}`);
            this.logger.error(`Error: ${JSON.stringify(e)}`);
            return;
        }

        // If the API version isn't available, we need to grab it from the initial registration
        if (isMQTTInitialRegistrationTopic(topic) && apiVersion === undefined) {
            apiVersion = await this.getApiVersionFromRegistrationTopic(componentId, topic, payload);
        }

        switch (apiVersion) {
            case 2:
                await this.mqttV2Api.onMessage(componentId, topic as V2ApiTopic, payload);
                return;
            default:
                this.logger.warn(`Unrecognized MQTT API Version (${apiVersion}) for componentId: ${componentId}`);
        }
    }

    /**
     * Called when hardware registers itself with gumband.
     *
     * This method attempts to json parse the payload,
     * then handles the packet based on the parsed api version.
     *
     * @param {string} _componentId - parsed componentId
     * @param {MQTTInitialRegistrationTopic} topic - the topic indicating the initial registration
     * @param {object} payload - The incoming hardware data
     */
    private async getApiVersionFromRegistrationTopic (_componentId: string, topic: MQTTInitialRegistrationTopic, payload: Buffer): Promise<ApiVersion | undefined> {
        this.logger.debug('baseMqttPacketHandler.registerSystem()');
        switch (topic) {
            case V2SystemInfoTopic:
            {
                let jsonPayload;
                try {
                    const decodedPayload = payload.toString('utf-8');
                    jsonPayload = JSON.parse(decodedPayload);
                } catch (e) {
                    const message = `Payload could not be JSON parsed: ${payload}`;
                    this.logger.error(message);
                    if (isNativeError(e)) {
                        this.logger.error(e.message);
                    }
                    throw new Error(message);
                }
                this.logger.debug(`Received ${topic}: ${JSON.stringify(jsonPayload)}`);
                return jsonPayload?.api_ver;
            }
            default:
                return exhaustiveGuard(topic);
        }
    }
}
