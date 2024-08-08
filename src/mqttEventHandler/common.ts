import { IHardwareRegistrationCache } from '../hardwareRegistrationCache';
import { AnySource } from '../types/mqtt-api';

/**
 * This function is meant to wrap any IHardwareRegistrationCache business logic with the use of
 * the IHardwareRegistrationCacheLocks if the locks are present.
 *
 * Given the IHardwareRegistrationCache instance, a set of area to lock, the componentId, and a callback function,
 * this function will:
 *  1. lock the requested area of the cache for the given componentId
 *  2. execute the callback function
 *  3. unlock the acquired locks
 * @typedef {any} T - result of a Promise
 * @param {IHardwareRegistrationCache} cache - the instance of the HardwareRegistrationCache to lock registration within
 * @param {Set<AnySource>} locks - Set of registration areas to lock access to (this is a Set, so that we do ensure no repeated locks)
 * @param {string} componentId - the componentId to lock cache for
 * @param {Promise<T>} action - callback function which includes business logic to execute once the requested locks are acquired
 * @return {Promise<T>} the result of the action callback
 * @throws {Error} errors if any requested locks are not acquired
 */
export async function lockRegistrationCacheAndPerformAction<T> (cache: IHardwareRegistrationCache, locks: Set<AnySource>, componentId: string, action: ()=> Promise<T>): Promise<T> {
    const acquiredLocks: Map<AnySource, AnySource> = new Map<AnySource, AnySource>();

    /**
     * This function will release any locks that are present in the acquiredLocks Array
     * As it releases the locks, it removes the elements of the acquiredLocks array, until
     * acquiredLocks is empty
     */
    async function releaseLocks () {
        Promise.all(
            Array.from(acquiredLocks.keys()).map(async (lock) => {
                await cache.locks[lock].unlock(componentId);
                acquiredLocks.delete(lock);
            }),
        );
    }

    try {
        await Promise.all(
            Array.from(locks).map(async (lock) => {
                await cache.locks[lock].lock(componentId);
                acquiredLocks.set(lock, lock);
            }),
        );
    } catch (e) {
        // In this case, we should release the held locks before throwing an error.
        await releaseLocks();
        throw new Error(`Failed to acquire ${Array.from(locks).join(' registration lock and ')} registration lock for componentId: ${componentId}`);
    }

    let returnValue;
    try {
        returnValue = await action();
    } catch (e) {
        await releaseLocks();
        throw e;
    }

    await releaseLocks();

    return returnValue;
}
