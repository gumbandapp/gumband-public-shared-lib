export type ObjectValues<T> = T[keyof T];


/**
 * Typescript exhaustive guard (See: https://www.google.com/search?q=typescript+exhaustive+guard)
 *
 * Functionally, this is a wrapper for an error.
 * @param {never} _ - the enum that should be exhausted before this function is called
 * @param {string} errorMessage - [optional] error message if the application gets here at run time
 * @throws {Error}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const exhaustiveGuard = (_: never, errorMessage?: string): never => {
    throw new Error(errorMessage ? errorMessage : 'Exhaustive guard failed');
};

export const isNonEmptyString = (unknownString: unknown): unknownString is string => {
    return typeof unknownString === 'string' && unknownString !== '';
};

/**
 * Async wait
 *
 * Basic asynchronous wait for a specified amount of milliseconds
 * @param {number} ms  - ms to wait
 */
export const waitMs = async (ms: number) => {
    return new Promise<void>((resolve) => setTimeout(() => {
        resolve();
    }, ms));
};
