export * from './packetParser';
import EventEmitter from 'events';
import { isNativeError } from 'util/types';
import { IHardwareRegistrationCache } from '../../hardwareRegistrationCache';
import {
    AnySource,
    ApplicationInfo,
    PropertyRegistration,
    SystemInfo,
    V2ApiTopic,
    V2PropertyFormat,
    V2PropertyRegistration,
    V2Source,
    V2SystemInfo,
    V2UnpackedPropertyValue,
    isV2Source,
    V2JsonPropertyValue,
} from '../../types';
import { exhaustiveGuard } from '../../utils/usefulTS';
import { lockRegistrationCacheAndPerformAction } from '../common';
import { V2PacketParser } from './packetParser';

export const V2_EVENTS = {
    UNHANDLED_MSG: 'unhandledMessage',
    RECEIVED_MSG: 'receivedMessage',
    ONLINE: 'online',
    REGISTERED: 'registered',
    PROP_UPDATE: 'propertyUpdate',
} as const;

export type V2HardwareOnlinePayload = {
    componentId: string;
    online: boolean
}

// When the hardware registers a source (system | app)
// Note: Changes to registration will also be sent on this event
export type V2SourceRegisteredPayload = {
    componentId: string;
    source: V2Source;
    registered: boolean;
}

// When a property is published from hardware
export type V2PropertyUpdatePayload = {
    componentId: string;
    source: V2Source;
    path: string;
    format: V2PropertyFormat,
    unpackedValue: V2UnpackedPropertyValue;
    formattedValue: V2JsonPropertyValue;
    data: Buffer;
}

export type V2UnparsedEventPayload = {
    componentId: string;
    topic: V2ApiTopic;
    data: Buffer;
}

export type V2ApiEventMap = {
    [V2_EVENTS.UNHANDLED_MSG]: V2UnparsedEventPayload;
    [V2_EVENTS.RECEIVED_MSG]: V2UnparsedEventPayload;
    [V2_EVENTS.ONLINE]: V2HardwareOnlinePayload;
    [V2_EVENTS.REGISTERED]: V2SourceRegisteredPayload;
    [V2_EVENTS.PROP_UPDATE]: V2PropertyUpdatePayload;
}

// For now we define these type informations here
// Later, when allowing custom types, these can be swapped with either information from registration
// or from a database
export const GMBND_COLOR_FORMAT = [
    {
        name: 'white',
        min: 0,
        max: 255,
    },
    {
        name: 'red',
        min: 0,
        max: 255,
    },
    {
        name: 'green',
        min: 0,
        max: 255,
    },
    {
        name: 'blue',
        min: 0,
        max: 255,
    },
];

export const GMBND_LED_FORMAT = [
    {
        name: 'index',
        min: 0,
        max: 65535,
    },
    {
        name: 'brightness',
        min: 0,
        max: 255,
    },
    {
        name: 'white',
        min: 0,
        max: 255,
    },
    {
        name: 'red',
        min: 0,
        max: 255,
    },
    {
        name: 'green',
        min: 0,
        max: 255,
    },
    {
        name: 'blue',
        min: 0,
        max: 255,
    },
];

/**
 * This definition is a bit weird, but it does add typing to the event emitter on this interface.
 * I'm not convinced that this is any worse than the other implementations I've seen for wrapping event emitters for strict typing.
 * - D. Gardner
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface MqttApiV2 {
    on<Event extends keyof V2ApiEventMap>(event: Event, listener: (payload: V2ApiEventMap[Event])=> void): this;
    emit<Event extends keyof V2ApiEventMap>(event: Event, payload: V2ApiEventMap[Event]): boolean;
}

/**
 * MQTT API Version 2
 *
 * This class defines how the listener responds to hardware with the api_ver value === 2.
 */
export class MqttApiV2 extends EventEmitter { // eslint-disable-line @typescript-eslint/no-unsafe-declaration-merging
    registrationTimeouts: Record<V2Source, Record<string, NodeJS.Timeout>>;
    cache: IHardwareRegistrationCache;
    packetParser: V2PacketParser;

    /**
     * Default Constructor
     * @param {IHardwareRegistrationCache} cache - Implementation of the IHardwareRegistrationCache interface
     */
    constructor (cache: IHardwareRegistrationCache) {
        super();
        this.registrationTimeouts = { 'app': {}, 'system': {} };
        this.cache = cache;
        this.packetParser = new V2PacketParser();
    }

    /**
     * On message over MQTT
     *
     * @param {string} componentId - parsed componentId
     * @param {string} topic - published topic
     * @param {Buffer} payload - published data
     * @throws {Error} throws cache errors
     */
    async onMessage (componentId: string, topic: V2ApiTopic, payload: Buffer): Promise<void> {
        this.emit(V2_EVENTS.RECEIVED_MSG, { componentId, topic, data: payload });

        switch (topic) {
            case 'system/info':
                await this.handleSystemInfo(componentId, payload);
                break;
            case 'app/info':
                await this.handleAppInfo(componentId, payload);
                break;
            case 'app/prop':
                await this.handlePropertyRegistration(
                    componentId,
                    'app',
                    payload,
                );
                break;
            case 'system/prop':
                await this.handlePropertyRegistration(
                    componentId,
                    'system',
                    payload,
                );
                break;
            default: {
                // Format:
                // <source>/prop/<group>/<group>/.../<property>
                const splitTopic = topic.split('/');
                if (splitTopic[1] == 'prop') {
                    const source = splitTopic[0];
                    const propPath = splitTopic.splice(2);

                    if (!isV2Source(source)) {
                        throw new Error(`${source} is not a valid V2 API source`);
                    }

                    await this.handlePropertyTopic(
                        componentId,
                        source,
                        propPath,
                        payload,
                    );
                } else {
                    this.emit(V2_EVENTS.UNHANDLED_MSG, { componentId, topic, data: payload });
                }
                break;
            }
        }
    }

    /**
     * Called when V2 hardware publishes to the 'system/info' topic.
     *
     * @param {string} componentId - parsed componentId
     * @param {V2SystemInfo | Buffer} payload - published data (JSON parsed or an unprocessed Buffer)
     */
    async handleSystemInfo (componentId: string, payload: Buffer): Promise<void> {
        // Handle Last Will and Testament
        if (payload.length === 0) {
            this.emit(V2_EVENTS.ONLINE, { componentId, online: false });
            await lockRegistrationCacheAndPerformAction(this.cache, new Set(['system', 'app']), componentId, async () => this.cache.clearAllCacheForComponentId(componentId));
            return;
        }

        this.emit(V2_EVENTS.ONLINE, { componentId, online: true });

        let systemInfo: V2SystemInfo;
        try {
            systemInfo = await this.packetParser.parseSystemInfo(payload);
        } catch (reason) {
            let message = `Failed to unpack system/info payload for componentId: ${componentId}`;
            console.debug(message);
            if (isNativeError(reason)) {
                console.debug('Reason:', reason.message);
                message += `. Reason: ${reason.message}`;
            }

            console.debug('Clearing System and Application Registration from cache for componentId:', componentId);
            try {
                await lockRegistrationCacheAndPerformAction(this.cache, new Set(['system', 'app']), componentId, async () => this.cache.clearAllCacheForComponentId(componentId));
            } catch (e) {
                const message = `Failed to clear system info cache for componentId: ${componentId}`;
                console.error(message);
                if (isNativeError(e)) {
                    console.error(e.message);
                } else {
                    console.error(e);
                }

                throw new Error(message);
            }

            throw new Error(message);
        }

        try {
            await lockRegistrationCacheAndPerformAction(this.cache, new Set(['system']), componentId, async () => {
                await this.cache.cacheMQTTAPIVersion(componentId, systemInfo.api_ver);
                await this.cache.cacheSystemInfo(componentId, systemInfo);
            });
        } catch (e) {
            const message = `Failed to cache system info registration for componentId: ${componentId}`;
            console.error(message);
            if (isNativeError(e)) {
                console.error(e.message);
            } else {
                console.error(e);
            }

            throw new Error(message);
            // TODO [GUM-1297]: determine error handling for this:
            //   - Wait a certain amount of time and try again?
            //   - Re-init redis connection?
            //   - Create a developer log?
            //   - Re-request system info from hardware?
        }

        this.setRegistrationTimeoutForComponentIdAndSource(componentId, 'system');
    }

    /**
     * Called when a V2 hardware publishes to the 'app/info' topic
     *
     * @param {string} componentId - parsed componentId
     * @param {Buffer} payload - published payload Buffer
     * @return {void}
     */
    async handleAppInfo (componentId: string, payload: Buffer): Promise<void> {
        await lockRegistrationCacheAndPerformAction(this.cache, new Set(['app']), componentId, async (): Promise<void> => {
            const applicationRegistrationPreviouslyCompleted = await this.cache.isRegistered(componentId, 'app');

            if (applicationRegistrationPreviouslyCompleted) {
                console.info(`Stray app/info message received for componentId: ${componentId}. Clearing cached application registration.`);
                try {
                    await this.cache.clearCachedValues(componentId, 'app');
                } catch (e) {
                    const message = `Failed to clear application registration from cache for componentId: ${componentId}`;
                    console.error(message);
                    if (isNativeError(e)) {
                        console.error(e.message);
                    } else {
                        console.error(e);
                    }

                    throw new Error(message);
                }
                this.emitRegistrationEvent(componentId, 'app', false);
            }

            let appInfo;
            try {
                appInfo = await this.packetParser.parseApplicationInfo(payload);
            } catch (reason) {
                let message = `Invalid app/info payload for componentId: ${componentId}`;
                console.debug(message);
                if (isNativeError(reason)) {
                    console.debug('Reason:', reason.message);
                    message += `. Reason: ${reason.message}`;
                }

                throw new Error(message);
            }

            try {
                await this.cache.cacheApplicationInfo(componentId, appInfo);
            } catch (e) {
                const message = `Failed to cache Application Info for componentId: ${componentId}`;
                console.error(message);
                if (isNativeError(e)) {
                    console.error(e.message);
                } else {
                    console.error(e);
                }

                throw new Error(message);
            }


            this.setRegistrationTimeoutForComponentIdAndSource(componentId, 'app');
        });
    }

    /**
     * Called when a V2 hardware publishes to the '<source>/prop' topic
     *
     * @param {string} componentId - parsed componentId
     * @param {V2Source} source - the source of the message. For example, system or app
     * @param {Buffer} payload - published payload Buffer
     * @return {void}
     */
    async handlePropertyRegistration (componentId: string, source: V2Source, payload: Buffer): Promise<void> {
        return await lockRegistrationCacheAndPerformAction(this.cache, new Set([source]), componentId, async (): Promise<void> => {
            const registrationPreviouslyCompleted = await this.cache.isRegistered(componentId, source);

            if (registrationPreviouslyCompleted) {
                console.info(`Stray ${source} prop message received for componentId: ${componentId}. Clearing cached registration.`);
                try {
                    await Promise.all([this.cache.clearProperties(componentId, source), this.cache.setRegistered(componentId, source, false)]);
                } catch (e) {
                    const message = `Failed to clear application registration from cache for componentId: ${componentId}`;
                    console.error(message);
                    if (isNativeError(e)) {
                        console.error(e.message);
                    } else {
                        console.error(e);
                    }

                    throw new Error(message);
                }
                this.emitRegistrationEvent(componentId, source, false);
            }

            let prop: V2PropertyRegistration;
            try {
                prop = await this.packetParser.parseProperty(payload);
            } catch (reason) {
                let message = `Failed to unpack ${source} prop payload for componentId: ${componentId}`;
                console.debug(message);
                if (isNativeError(reason)) {
                    console.debug('Reason:', reason.message);
                    message += `. Reason: ${reason.message}`;
                }

                throw new Error(message);
            }

            let registeredProps: Array<PropertyRegistration>;
            try {
                registeredProps = await this.cache.getAllProperties(componentId, source);
            } catch (e) {
                const message = `Failed to get ${source} properties from cache for componentId: ${componentId}`;
                console.error(message);
                if (isNativeError(e)) {
                    console.error(e.message);
                } else {
                    console.error(e);
                }

                throw new Error(message);
            }

            try {
                registeredProps.forEach((cachedProp) => {
                    // Important note in this logic: if the combination of the topic AND the index are unique among the previously registered props OR an exact match with one of previously registered props, there is no error
                    if (cachedProp.index === prop.index && cachedProp.path !== prop.path) {
                        throw new Error('property index is not unique');
                    }

                    if (cachedProp.path === prop.path && cachedProp.index !== prop.index) {
                        throw new Error('property topic is not unique');
                    }
                });
            } catch (reason) {
                let message = 'New property is not compatible with previously registered properties';
                console.debug(message);
                if (isNativeError(reason)) {
                    console.debug('Reason:', reason.message);
                    message += `. Reason: ${reason.message}`;
                }

                throw new Error(message);
            }

            try {
                await this.cache.cacheProperty(componentId, source, prop.path, prop);
            } catch (e) {
                const message = `Failed to cache ${source} Property for componentId: ${componentId}`;
                console.error(message);
                if (isNativeError(e)) {
                    console.error(e.message);
                } else {
                    console.error(e);
                }

                throw new Error(message);
            }

            this.setRegistrationTimeoutForComponentIdAndSource(componentId, source);
        });
    }

    /**
     * Handles the generic cases of different property actions
     *
     * @param {string} componentId - parsed HardwareID
     * @param {V2Source} source - the source of the message. For example, system or app
     * @param {Array<string>} subTopics - split subtopics under the property heading
     * @param {Buffer} payload - value contained in property publish
     */
    async handlePropertyTopic (componentId: string, source: V2Source, subTopics: Array<string>, payload: Buffer): Promise<void> {
        const action = subTopics.at(-1);
        switch (action) {
            case 'set':
                // Unhandled setter
                break;
            case 'get':
                // Unhandled getter
                break;
            default:
                await this.handlePropertyValueUpdate(componentId, source, subTopics, payload);
                break;
        }
    }
    /**
     *
     * @param {string} componentId - the hardware ID we're setting property for
     * @param {V2Source} source - the source of the message. For example, system or app
     * @param {Array<string>} propertyInfo - an array containing either a single property name, or a group name followed by a prop name
     * @param {Buffer} payload - the value to be parsed and published to all concerned parties
     */
    async handlePropertyValueUpdate (componentId: string, source: V2Source, propertyInfo: Array<string>, payload: Buffer): Promise<void> {
        const propTopic = propertyInfo.join('/');
        let registeredProperty: V2PropertyRegistration | undefined;
        // Fetch Prop Info from Redis
        try {
            registeredProperty = await this.cache.getProperty(componentId, source, propTopic);
        } catch (e) {
            const message = `Failed to get ${source} property "${propTopic}" from the cache`;
            console.error(message);
            if (isNativeError(e)) {
                console.debug(e.message);
            } else {
                console.debug(e);
            }
            throw new Error(message);
        }

        if (registeredProperty === undefined) {
            throw (new Error(`Invalid ${source} property registration for, "${propTopic}" in the cache`));
        }

        try {
            // Pass Format and buffer to parser
            const unpackedPayload = this.packetParser.parsePropertyValue(payload, registeredProperty);
            const formattedPayload = this.packetParser.jsonFormatPropertyValue(unpackedPayload, registeredProperty);
            console.log(`format: "${registeredProperty.format}", unpackedPayload: ${JSON.stringify(unpackedPayload)}, jsonPayload: ${formattedPayload}`);
            this.emit(V2_EVENTS.PROP_UPDATE, {
                componentId,
                source,
                path: registeredProperty.path,
                format: registeredProperty.format,
                data: payload,
                unpackedValue: unpackedPayload,
                formattedValue: formattedPayload,
            });
        } catch (e) {
            const message = `Parsing failed for ${source} property ${propTopic} from ${componentId}`;
            console.error(message);
            throw new Error(message);
        }
    }

    /**
     * Method called after any application registration event to determine if application registration process is complete.
     *
     * This method sets a new JS timeout to run @checkApplicationRegistrationForComponentIdAndSource
     *
     * At scale, this may lead to a few issues. If registration packets are sent to multiple instances of the listener,
     * each will have a timeout set to verify the application registration.
     *
     * To attempt to reduce the race conditions, the logic to determine if the application registers only executes if the cache
     * says the application is unregistered when the timeout executes.
     *
     * Long term, we may want to replace this with some kind of scheduled event in redis, however in order to keep this logic
     * as part of this module, I've gone with this approach for now.
     * @param {string} componentId - parsed componentId
     * @param {V2Source} source - the source of the message. For example, system or app
     * @return {void} - true is application registration completed successfully
     */
    private setRegistrationTimeoutForComponentIdAndSource (componentId: string, source: AnySource): void {
        if (this.registrationTimeouts[source][componentId]) {
            clearTimeout(this.registrationTimeouts[source][componentId]);
        }

        this.registrationTimeouts[source][componentId] = setTimeout(() => {
            try {
                this.checkRegistrationForComponentIdAndSource(componentId, source);
            } catch (e) {
                console.error('Error occurred while evaluating application registration');
                if (isNativeError(e)) {
                    console.debug(e.message);
                } else {
                    console.debug(e);
                }
            }
        }, 3 * 1000); // TODO: make this more dynamic
    }

    /**
     * Method called to determine if application registration process is complete
     *
     * @param {string} componentId - parsed componentId
     * @param {V2Source} source - the source of the message. For example, system or app
     * @return {Promise<void>} - true is application registration completed successfully
     * @fires MqttApiV2#ApplicationRegistration
     */
    async checkRegistrationForComponentIdAndSource (componentId: string, source: AnySource): Promise<void> {
        await lockRegistrationCacheAndPerformAction(this.cache, new Set([source]), componentId, async () => {
            try {
                if (await this.cache.isRegistered(componentId, source)) {
                    // Because this method could run in one instance of the listener after another instance of the listener has already determined that the application is register, this early return saves processing at scale
                    console.log(`determined ${source} was previously registered -> no-op`);
                    return;
                }
            } catch (e) {
                const message = `Failed to get ${source} iRegistered from the cache`;
                console.error(message);
                console.error(e);
                throw new Error(message);
            }

            let sourceInfo: ApplicationInfo | SystemInfo | undefined;
            try {
                switch (source) {
                    case 'system':
                        sourceInfo = await this.cache.getSystemInfo(componentId);
                        break;
                    case 'app':
                        sourceInfo = await this.cache.getApplicationInfo(componentId);
                        break;
                    default:
                        sourceInfo = exhaustiveGuard(source);
                        break;
                }
            } catch (e) {
                const message = `Unable to get ${source} from the cache`;
                console.error(message);
                if (isNativeError(e)) {
                    console.debug(e.message);
                } else {
                    console.debug(e);
                }
                throw new Error(message);
            }

            if (sourceInfo?.num_props === undefined) {
                throw new Error(`${source} info is invalid`);
            }

            const expectNumberOfProps = sourceInfo.num_props;

            let registeredProperties;
            try {
                registeredProperties = await this.cache.getAllProperties(componentId, source);
            } catch (e) {
                const message = `Failed to get ${source} properties from the cache`;
                console.error(message);
                if (isNativeError(e)) {
                    console.debug(e.message);
                } else {
                    console.debug(e);
                }
                throw new Error(message);
            }

            if (
                (registeredProperties && expectNumberOfProps === registeredProperties.length) ||
                (!registeredProperties && expectNumberOfProps === 0)
            ) {
                // The application registration is complete!
                console.log(`${source} Registered!`);
                try {
                    await this.cache.setRegistered(componentId, source, true);
                } catch (e) {
                    const message = `[Critical] Failed to set ${source} isRegistered to true in the cache`;
                    console.error(message);
                    if (isNativeError(e)) {
                        console.debug(e.message);
                    } else {
                        console.debug(e);
                    }
                    throw new Error(message);
                }

                this.emitRegistrationEvent(componentId, source, true);
            } else {
                // Only emit the not registered event if the timeout occurs
                this.emitRegistrationEvent(componentId, source, false);
            }
        });
    }

    /**
     * Emit an ApplicationRegistration event
     * @param {string} componentId - The componentId associated with the registration event
     * @param {V2Source} source - the source of the message. For example, system or app
     * @param {boolean} isRegistered - Indicates whether the source is registered.
     * @fires MqttApiV2#ApplicationRegistration
     */
    private emitRegistrationEvent (componentId: string, source: V2Source, isRegistered: boolean) {
        this.emit(V2_EVENTS.REGISTERED, {
            componentId,
            source,
            registered: isRegistered,
        });
    }
}

/**
 * Registration event.
 *
 * This is event is emit when a source's registration state changes for a system.
 *
 * @event MqttApiV2#nRegistration
 * @type {object}
 * @property {string} componentId - The componentId associated with the registration event
 * @property {V2Source} source
 * @property {boolean} isRegistered - Indicates whether the application is registered.
 */
