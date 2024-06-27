import EventEmitter from 'events';
import { AnySource, ApiVersion, ApplicationInfo, SystemInfo, PropertyRegistration } from '../types/mqtt-api';


/**
 * This interface is meant to be implemented as a redis cache in the cloud and implemented as some a local cache for the SDK
 *
 * Implementations of this class cache the registration messages for future reference and serve as the source to determine whether or not hardware
 * is registered.
 *
 * The registration processes managed by this class:
 *  - System Registration
 *      - This is hardware identifying itself to the platform
 *      - The registration of the apiVersion is required for any mqtt messages to be understood by a listener
 *  - System Property Registration
 *      - This is required to be completed before system property events can be handled by an mqtt listener
 *
 *  - Application Registration
 *      - This is a hardware declaring the application metadata and application properties associated with the hardware
 *  - Application Property Registration
 *      - This is required to be completed before application property events can be handled properly by an mqtt listener
 */
export interface IHardwareRegistrationCache extends EventEmitter {
    ready: boolean

    /**
     * Method to store the API Version of hardware in the cache for a given componentId
     *
     * This method is required because the API Version may not always be stored as the
     * 'api_ver' property of the 'system/info' payload.
     *
     * If we store the API Version independently, we can always access it without having to assume
     * any payload structure when a new message comes in.
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {ApiVersion} apiVersion - the parsed apiVersion from the event
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to store the data
     */
    cacheMQTTAPIVersion(componentId: string, apiVersion: ApiVersion): Promise<void>;

    /**
     * Method to get the API Version of hardware in the cache for a given componentId
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<ApiVersion | undefined>} - the cached ApiVersion or undefined if the cache does not contain the data
     * @throws {Error} - if the cache fails to retrieve the data
     */
    getMQTTAPIVersion(componentId: string): Promise<ApiVersion | undefined>;

    /**
     * Method to clear the API Version of hardware from the cache for a given componentId
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearMQTTAPIVersion(componentId: string): Promise<void>;

    /**
     * Method to store the SystemInfo of hardware in the cache for a given componentId
     *
     * For the V2 cloud API, this may not be needed. This is here because this is a registration cache
     * and the system info is the V2 payload that communicates the hardware registration.
     *
     * For future API versions, if the system registration becomes a multi-event process (like the application registration),
     * then this would be useful here.
     *
     * Storing this info in a cache could also be useful to the SDK developers.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {SystemInfo} systemInfo - the parsed system info payload
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to store the data
     */
    cacheSystemInfo(componentId: string, systemInfo: SystemInfo): Promise<void>;

    /**
     * Method to get the SystemInfo from the cache for a given componentId
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<SystemInfo | undefined>} - the cached SystemInfo or undefined if the cache does not contain the data
     * @throws {Error} - if the cache fails to retrieve the data
     */
    getSystemInfo(componentId: string): Promise<SystemInfo | undefined>;

    /**
     * Method to remove the SystemInfo from the cache for a given componentId
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearSystemInfo(componentId: string): Promise<void>;

    /**
     * Method to store the ApplicationInfo of hardware in the cache for a given componentId
     *
     * For the V2 cloud API, this is required to verify that the number of registered properties
     * by index are appropriate given the num_props property of this object.
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {ApplicationInfo} applicationInfo - the parsed application information payload
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to store the data
     */
    cacheApplicationInfo(componentId: string, applicationInfo: ApplicationInfo): Promise<void>;

    /**
     * Method to get the ApplicationInfo of hardware in the cache for a given componentId
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<ApplicationInfo | undefined>} - the cached ApplicationInfo or undefined if the cache does not contain the data
     * @throws {Error} - if the cache fails to retrieve the data
     */
    getApplicationInfo(componentId: string): Promise<ApplicationInfo | undefined>;

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
     * @throws {Error} if the cache fails to store the data
     */
    cacheProperty(componentId: string, source: AnySource, propertyTopic: string, propertyRegistration: PropertyRegistration): Promise<void>;

    /**
     * Method to get a single property registration payload in the cache for a given
     * componentId, source, and propertyTopic string
     *
     * For the V2 API, this is used once registration is complete to retrieve a single property
     * registration from the cache using the topic.
     * From there, the handler can use the format to unpack the property value.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @param {string} propertyTopic - the parsed property topic to register for this property
     * @returns {Promise<PropertyRegistration | undefined>} - the cached PropertyRegistration or undefined if the cache does not contain the data
     * @throws {Error} - if the cache fails to retrieve the data
     */
    getProperty(componentId: string, source: AnySource, propertyTopic: string): Promise<PropertyRegistration | undefined>;

    /**
     * Method to get all the cached registrations for a given componentId and source.
     *
     * For the V2 API, this is used during the property registration process to ensure that all property topics
     * and all property indexes are unique for a given source.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @returns {Promise<Array<PropertyRegistration>>} - an array of the cached PropertyRegistration objects
     * @throws {Error} - if the cache fails to retrieve the data
     */
    getAllProperties(componentId: string, source: AnySource): Promise<Array<PropertyRegistration>>;

    /**
     * Method to clear all cached properties that were previously registered for a given componentId and source.
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearProperties(componentId: string, source: AnySource): Promise<void>;

    /**
     * Method to cache the registration state for a given componentId and source.
     *
     * For API V2, the application registration process can take several individual mqtt events to complete.
     * This flag acts as a way of saying The application registration is cached and all the system properties are valid.
     * This approach means we don't have to manage separate 'registered' vs 'incoming' property hash tables
     * and we don't have to fully evaluate the application registration state for every property event.
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @param {boolean} isRegistered - true if the registration for the given source is complete
     * @returns {Promise<void>}
     */
    setRegistered(componentId: string, source: AnySource, isRegistered: boolean): Promise<void>;

    /**
     * Method to check the registration state for a given componentId and source.
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @returns {Promise<boolean>} - true if the registration is complete for the given source, false if it is not
     * @throws {Error} - if the cache fails to retrieve the data
     */
    isRegistered(componentId: string, source: AnySource): Promise<boolean>;

    /**
     * Method to remove the info of a system from the cache for a given componentId and source
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearInfoAndRegistered(componentId: string, source: AnySource): Promise<void>;

    /**
     * Method to remove all the cached registration information for a given componentId and source
     *
     * Should remove the registered info, properties, and ensure that called isRegistered() will return false for the given source.
     *
     * @param {string} componentId - the parsed componentId from the event topic
     * @param {AnySource} source - the source of the message. For example, system or app
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearCachedValues(componentId: string, source: AnySource): Promise<void>;

    /**
     * Method to remove all the cached information from the cache for a given componentId
     *
     * To be used when the system goes offline.
     * @param {string} componentId - the parsed componentId from the event topic
     * @returns {Promise<void>}
     * @throws {Error} if the cache fails to remove the data
     */
    clearAllCacheForComponentId(componentId: string): Promise<void>;

    locks?: IHardwareRegistrationCacheLocks;
}

/**
 * This type owns a set of optional additional functions for @IHardwareRegistrationCache interface
 * In horizontally scaled listener systems, where all instances share the same cache, it may be useful to
 * lock and unlock areas of the the system and/or application registration cache for multi-step business
 * logic that reads and writes to the cache multiple times.
 *
 * As of now, this interface includes locks for the two registration processes:
 *  - System Registration
 *  - Application Registration
 *
 * For the V2 MQTT API contract this is sufficient, but if more specific lock functions are required (ie for the
 * cached MQTT API version or for application properties), then new interface definitions should be added here.
 *
 * The intended use of these methods is to wrap any of the use of the registration cache methods and relevant
 * business logic within the most relevant "lock" and "unlock" methods respectively. The "lock" methods, if present,
 * should prevent any other instance of the listener from claiming the lock until the corresponding "unlock"
 * method is called.
 *
 * In doing this, all the business logic and order of functions are sequenced properly among all the instances of the listener.
 */
export type IHardwareRegistrationCacheLocks = Record<AnySource, ICacheLockByComponentId>;

/**
 * In horizontally scaled systems, where multiple listener applications share the same cache, this interface should
 * be used to prevent race conditions by "locking" access to a specific area of the cache for the given componentId.
 */
export interface ICacheLockByComponentId {
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
   lock(componentId: string, timeoutMS?: number): Promise<void>;

    /**
     * Unlock method for a specific area in the cache for a given componentId.
     *
     * This method should release the system registration lock for the componentId if it exists.
     * @param {string} componentId - the parsed componentId from the event topic
     * @throws {Error} - errors if lock fails to be released
     */
    unlock(componentId: string): Promise<void>;
}
