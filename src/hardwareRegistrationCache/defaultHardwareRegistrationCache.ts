import EventEmitter from 'events';
import type { AnySource, ApiVersion, ApplicationInfo, AppRegistration, SystemInfo, SystemRegistration, HardwareRegistration, PropertyRegistration } from '../types/mqtt-api';
import { ICacheLockByComponentId, IHardwareRegistrationCache } from './IHardwareRegistrationCache';

type PartialAppRegistration = Partial<AppRegistration> & Pick<AppRegistration, 'properties'>;
type PartialSystemRegistration = Partial<SystemRegistration> & Pick<SystemRegistration, 'properties'>;

type PartialHardwareManifest = Partial<Omit<HardwareRegistration, 'app' | 'system'>> & {
    app: PartialAppRegistration,
    system: PartialSystemRegistration,
}

type RegistrationHash = Record<string, PartialHardwareManifest>;

/**
 *  Async wait
 * @param {number} ms  - ms to wait
 */
async function waitMs (ms: number) {
    return new Promise<void>((resolve) => setTimeout(() => {
        resolve();
    }, ms));
}


/**
 * Very basic locking mechanism with timeout support
 */
export class DefaultCacheLock implements ICacheLockByComponentId {
    private heldLocks: Set<string>;
    private timeouts: Map<string, ReturnType<typeof setTimeout>>;

    /**
     * Constructor
     *
     * Initializes internal data
     */
    constructor () {
        this.heldLocks = new Set<string>();
        this.timeouts = new Map<string, ReturnType<typeof setTimeout>>();
    }

    /**
     * Lock method for a specific area in the cache for a given componentId.
     *
     * This method should prevent other instances of the listener from to writing to and reading from the
     * cache for the specified componentId.
     *
     * If the lock is not available, this method should delay its return until the lock is acquired or throw an error.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {number} [timeoutMS] - optional automatic timeout (in ms) for the lock
     * @throws {Error} - errors if lock fails to be acquired
     */
    async lock (componentId: string, timeoutMS?: number): Promise<void> {
        // Check every 100ms
        while (this.heldLocks.has(componentId)) {
            await waitMs(100);
        }

        this.heldLocks.add(componentId);

        if (timeoutMS !== undefined) {
            this.timeouts.set(componentId, setTimeout(() => {
                this.heldLocks.delete(componentId);
            }, timeoutMS));
        }
    }

    /**
     * Unlock method for a specific area in the cache for a given componentId.
     *
     * This method should release the system registration lock for the componentId if it exists.
     * @param {string} componentId - the parsed componentId from the event topic
     * @throws {Error} - errors if lock fails to be released
     */
    async unlock (componentId: string): Promise<void> {
        clearTimeout(this.timeouts.get(componentId));
        this.heldLocks.delete(componentId);
    }
}

/**
 * RedisHardwareRegistrationCache Class
 * @implements {IHardwareRegistrationCache}
 *
 * This class is a default implementation of the IHardwareRegistrationCache interface.
 * It manages mqtt hardware registration in memory and will be used by the Node SDK.
 *
 * It does this by maintaining 4 separate in-memory hashes for each hardware:
 *  - One which handles system registration
 *  - One which specifically handles system properties
 *      - For the V2 api, this is considered part of the application registration, but
 *        this is useful to be able to retrieve a specific property registration using
 *        the property topic as the key
 *  - One which handles application registration
 *  - One which specifically handles application properties
 *      - For the V2 api, this is considered part of the application registration, but
 *        this is useful to be able to retrieve a specific property registration using
 *        the property topic as the key
 */
export class HardwareRegistrationCache extends EventEmitter implements IHardwareRegistrationCache {
    ready: boolean;
    logHashOnChange: boolean;
    locks: {'system': DefaultCacheLock, 'app': DefaultCacheLock};
    protected registrationHash: RegistrationHash;

    /**
     * HardwareRegistrationCache constructor
     * @param {boolean} [logHashOnChange=false] - if true, this class will print debug logs with the console of the full cache on every change
     */
    constructor (logHashOnChange: boolean = false) {
        super();
        this.locks = { 'system': new DefaultCacheLock(), 'app': new DefaultCacheLock() };
        this.registrationHash = {};
        this.logHashOnChange = logHashOnChange;
        this.ready = true;
        this.emit('ready');
    }

    /**
     * Implementation of IHardwareRegistrationCache.cacheMQTTAPIVersion method
     *
     * This method stores the apiVersion in the system registration hash
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {ApiVersion} apiVersion - the parsed apiVersion from the event
     * @return {Promise<void>}
     * @throws {Error} if the cache fails to store the data
     */
    async cacheMQTTAPIVersion (componentId: string, apiVersion: ApiVersion): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId].apiVersion = apiVersion;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.getMQTTAPIVersion method
     *
     * Returns the apiVersion in the system registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @return {Promise<ApiVersion | undefined>} the apiVersion in the system registration hash for the given componentId or undefined if the cache does not contain the data
     */
    async getMQTTAPIVersion (componentId: string): Promise<ApiVersion | undefined> {
        return this.registrationHash[componentId]?.apiVersion;
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearMQTTAPIVersion method
     *
     * Removes the apiVersion from the system registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     */
    async clearMQTTAPIVersion (componentId: string): Promise<void> {
        delete this.registrationHash[componentId].apiVersion;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.cacheSystemInfo method
     *
     * Writes the systemInfo to the system registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {SystemInfo} systemInfo - the parsed system info payload
     */
    async cacheSystemInfo (componentId: string, systemInfo: SystemInfo): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId].system.info = systemInfo;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.getSystemInfo method
     *
     * Retrieves the systemInfo in the system registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @return {Promise<SystemInfo | undefined>} - the cached SystemInfo or undefined if the cache does not contain the data
     */
    async getSystemInfo (componentId: string): Promise<SystemInfo | undefined> {
        return this.registrationHash[componentId]?.system?.info;
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearSystemInfo method
     *
     * Removes the systemInfo from the system registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     */
    async clearSystemInfo (componentId: string): Promise<void> {
        delete this.registrationHash[componentId].system.info;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.cacheApplicationInfo method
     *
     * Writes the applicationInfo to the application registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {ApplicationInfo} applicationInfo - the parsed application information payload
     */
    async cacheApplicationInfo (componentId: string, applicationInfo: ApplicationInfo): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId].app.info = applicationInfo;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.getApplicationInfo method
     *
     * Retrieves the applicationInfo in the application registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @return {Promise<ApplicationInfo | undefined>} - the cached ApplicationInfo or undefined if the cache does not contain the data
     */
    async getApplicationInfo (componentId: string): Promise<ApplicationInfo | undefined> {
        return this.registrationHash[componentId]?.app.info;
    }

    /**
     * Method to store a single property registration payload in the cache for a given componentId and source
     *
     * For the V2 cloud API, we store these as a hash using the propertyTopic as the key, so that
     * when processing messages after registration, we can look up the property registration format
     * quickly based on the topic for unpacking.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @param {string} propertyTopic - the parsed property topic to register for this property
     * @param {PropertyRegistration} propertyRegistration - the registration for the property
     * @return {Promise<void>}
     */
    async cacheProperty (componentId: string, source: AnySource, propertyTopic: string, propertyRegistration: PropertyRegistration): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId][source].properties[propertyTopic] = propertyRegistration;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.getProperty method
     *
     * Retrieves the property from the properties hash for the given componentId, source, and propertyTopic
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @param {string} propertyTopic - the parsed property topic to register for this property
     * @return {Promise<PropertyRegistration>} - the cached PropertyRegistration
     */
    async getProperty (componentId: string, source: AnySource, propertyTopic: string): Promise<PropertyRegistration | undefined> {
        return this.registrationHash[componentId][source].properties[propertyTopic];
    }

    /**
     * Implementation of IHardwareRegistrationCache.getProperties method
     *
     * Retrieves the full properties hash for the given componentId and returns the values as an array
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @return {Promise<Array<PropertyRegistration>>} - an array of the cached PropertyRegistration objects
     */
    async getAllProperties (componentId: string, source: AnySource): Promise<PropertyRegistration[]> {
        return Object.values(this.registrationHash[componentId][source].properties);
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearAllProperties method
     *
     * Deletes the properties hash for the given componentId and source
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     */
    async clearProperties (componentId: string, source: AnySource): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId][source].properties = {};
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.setRegistered method
     *
     * Writes isApplicationRegistered to the application registration hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @param {boolean} isRegistered - true if the registration is complete
     */
    async setRegistered (componentId: string, source: AnySource, isRegistered: boolean): Promise<void> {
        this.initCachedHardwareManifest(componentId);
        this.registrationHash[componentId][source].isRegistered = isRegistered;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.isApplicationRegistered method
     *
     * Reads the application registration hash for the given componentId and returns true if the
     * isApplicationRegistered flag is "true".
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @return {Promise<boolean>} - true if the application registration is complete, false if it is not
     */
    async isRegistered (componentId: string, source: AnySource): Promise<boolean> {
        return this.registrationHash[componentId][source].isRegistered === true;
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearInfoAndRegistered method
     *
     * Deletes the registration hash for the given componentId.
     * This will also remove the isRegistered flag.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     */
    async clearInfoAndRegistered (componentId: string, source: AnySource): Promise<void> {
        delete this.registrationHash[componentId][source];
        this.registrationHash[componentId][source].isRegistered = false;
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearApplicationRegistration method
     *
     * Deletes the application registration hash and application properties hash for the given componentId
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     */
    async clearCachedValues (componentId: string, source: AnySource): Promise<void> {
        await Promise.all([
            this.clearInfoAndRegistered(componentId, source),
            this.clearProperties(componentId, source),
        ]);
        this.logRegistrationHash();
    }

    /**
     * Implementation of IHardwareRegistrationCache.clearAllCacheForComponentId method
     *
     * Deletes the registration and properties hash for the given componentId for all sources
     * via @clearApplicationRegistration
     * Deletes the system registration hash for the given componentId via @clearSystemRegistration
     * @param {string} componentId - the parsed componentId from the event topic
     */
    async clearAllCacheForComponentId (componentId: string): Promise<void> {
        delete this.registrationHash[componentId];
        this.logRegistrationHash();
    }

    /**
     * Helper function to initialize Cached HardwareManifest if it doesn't exist
     *
     * @param {string} componentId - componentId to use to init the cached manifest
     */
    private initCachedHardwareManifest (componentId: string): void {
        if (this.registrationHash[componentId] === undefined) {
            this.registrationHash[componentId] = {
                system: {
                    properties: {},
                },
                app: {
                    properties: {},
                },
            };
        }
    }

    /**
     * Helper function to get visibility into the in memory cache for debugging
     */
    logRegistrationHash (): void {
        if (this.logHashOnChange) {
            console.debug('In memory registration cache:');
            console.debug(JSON.stringify(this.registrationHash, null, 2));
        }
    }
}
