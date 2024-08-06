/* eslint-disable no-process-env */
// Disabling the use of prcoess env in this file because we use it to do validation
import { LOG_LEVELS, LogLevelType } from '../constants/LogLevels';


export type ObjectValues<T> = T[keyof T];


/**
 * Typescript exhaustive guard (See: https://www.google.com/search?q=typescript+exhaustive+guard)
 *
 * Functionally, this is a wrapper an error.
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
 * Utility function that will eventually become part of a shared library
 *
 * @param {string} name - name of the environment variable to parse
 * @return {string} value of the environment variable
 * @throws {Error} when variable is not found in the environment
 */
export const parseEnvStrOrError = (name: string): string => {
    const env = process.env[name] || null;

    if (env == null) {
        throw Error(`Environment variable [${name}] must be provided and was not`);
    }

    return env;
};

/**
 * @description a type guard that ensures an env variable is an acceptable log level (based on the npm log levels implemented by winston), useful for setting env vars
 * @param {any} name - the unknown log level to validate
 * @return {boolean} - whether the log level is valid
 */
export const isValidLogLevel = (name: unknown): name is LogLevelType => {
    if (Object.values(LOG_LEVELS).includes(name as LogLevelType)) {
        return true;
    } else {
        return false;
    }
};
