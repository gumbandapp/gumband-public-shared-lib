import { LogLevelType } from '../constants/LogLevels';
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */ // We expect console statements in this module, it's a logger...
export type VariousLoggerTransportInstancesArray = any[];

/** Options for the logger */
export interface GbLoggerConstructorObjectOpts {
    /** Hide the UTC timestamp? */
    hideUtc?: boolean;
    /** The log level */
    level?: LogLevelType;
    /** The name of the logger */
    name?: string;
    /** A timezone string, when omitted timestamps will be UTC */
    tz?: string;
    /** The injected logger instance */
    logger?: LoggerInterface;
}

export interface LoggerInterface {
    error: (message: unknown) => void;
    warn: (message: unknown) => void;
    info: (message: unknown) => void;
    http: (message: unknown) => void;
    verbose: (message: unknown) => void;
    debug: (message: unknown) => void;
    silly: (message: unknown) => void;
    removeTransport?: (transport: any) => void;
    addTransport?: (transport: any) => void;
}

/**
 * A default logger implementation that mimics the previous behavior
 */
class DefaultLogger implements LoggerInterface {
    /**
     * @description Log an error message
     * @param {unknown} message - The message to log
     */
    error (message: unknown): void {
        if (typeof message === 'object') {
            console.error(JSON.stringify(message, null, 2));
        } else {
            console.error(message);
        }
    }

    /**
     * @description Log a warning message
     * @param {unknown} message - The message to log
     */
    warn (message: unknown): void {
        if (typeof message === 'object') {
            console.warn(JSON.stringify(message, null, 2));
        } else {
            console.warn(message);
        }
    }
    /**
     * @description Log an info message
     * @param {unknown} message - The message to log
     */
    info (message: unknown): void {
        if (typeof message === 'object') {
            console.info(JSON.stringify(message, null, 2));
        } else {
            console.info(message);
        }
    }

    /**
     * @description Log an http message
     * @param {unknown} message - The message to log
     */
    http (message: unknown): void {
        if (typeof message === 'object') {
            console.log(JSON.stringify(message, null, 2));
        } else {
            console.log(message);
        }
    }

    /**
     * @description Log a verbose message
     * @param {unknown} message - The message to log
     */
    verbose (message: unknown): void {
        if (typeof message === 'object') {
            console.log(JSON.stringify(message, null, 2));
        } else {
            console.log(message);
        }
    }

    /**
     * @description Log a debug message
     * @param {unknown} message - The message to log
     */
    debug (message: unknown): void {
        if (typeof message === 'object') {
            console.debug(JSON.stringify(message, null, 2));
        } else {
            console.debug(message);
        }
    }

    /**
     * @description Log a silly message
     * @param {unknown} message - The message to log
     */
    silly (message: unknown): void {
        if (typeof message === 'object') {
            console.log(JSON.stringify(message, null, 2));
        } else {
            console.log(message);
        }
    }
}

/**
 * A logger class that wraps the injected logger
 */
export class GbLogger implements LoggerInterface {
    private logger: LoggerInterface;

    /* eslint-disable-next-line require-jsdoc */
    constructor (opts?: GbLoggerConstructorObjectOpts) {
        if (
            opts?.hideUtc ||
            opts?.level ||
            opts?.name ||
            opts?.tz
        ) {
            console.warn('Opts hideUtc, level, name and tz are not supported anymore, instead you should inject your logger instance.');
        }
        this.logger = opts?.logger || new DefaultLogger();
    }

    /**
     * @description Log an error message
     * @param {unknown} message - The message to log
     */
    error (message: unknown): void {
        this.logger.error(message);
    }

    /**
     * @description Log a warning message
     * @param {unknown} message - The message to log
     */
    warn (message: unknown): void {
        this.logger.warn(message);
    }

    /**
     * @description Log an info message
     * @param {unknown} message - The message to log
     */
    info (message: unknown): void {
        this.logger.info(message);
    }

    /**
     * @description Log an http message
     * @param {unknown} message - The message to log
     */
    http (message: unknown): void {
        this.logger.http(message);
    }

    /**
     * @description Log a verbose message
     * @param {unknown} message - The message to log
     */
    verbose (message: unknown): void {
        this.logger.verbose(message);
    }

    /**
     * @description Log a debug message
     * @param {unknown} message - The message to log
     */
    debug (message: unknown): void {
        this.logger.debug(message);
    }

    /**
     * @description Log a silly message
     * @param {unknown} message - The message to log
     */
    silly (message: unknown): void {
        this.logger.silly(message);
    }

    /**
     * @description addTransport - Add a transport to the logger, (if the logger supports that method)
     * @param {any} transport - The transport to add
     * @return {void}
     * @deprecated This method is deprecated and will be removed in the future
     */
    addTransport (transport: any): void {
        if (this.logger.addTransport) {
            this.logger.addTransport(transport);
        } else {
            console.warn('Logger does not support addTransport anymore.');
        }
    }

    /**
     * @description removeTransport - Remove a transport from the logger, (if the logger supports that method)
     * @param {any} transport - The transport to remove
     * @return {void}
     git * @deprecated This method is deprecated and will be removed in the future
     */
    removeTransport (transport: any): void {
        if (this.logger.removeTransport) {
            this.logger.removeTransport(transport);
        } else {
            console.warn('Logger does not support removeTransport anymore.');
        }
    }
}
