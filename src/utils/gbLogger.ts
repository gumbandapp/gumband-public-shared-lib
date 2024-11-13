import { LogLevelType } from '../constants/LogLevels';
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */ // We expect console statements in this module, it's a logger...
export type VariousLoggerTransportInstancesArray = any[];

export type GbLoggerConstructorObjectOpts = {
    hideUtc?: boolean
    level?: LogLevelType;
    name?: string;
    tz?: string; // A timezone string, when omitted timestamps will be UTC
    logger?: LoggerInterface; // Injected logger instance
};

export interface LoggerInterface {
    error: (message: any) => void;
    warn: (message: any) => void;
    info: (message: any) => void;
    http: (message: any) => void;
    verbose: (message: any) => void;
    debug: (message: any) => void;
    silly: (message: any) => void;
    removeTransport?: (transport: any) => void;
    addTransport?: (transport: any) => void;
}

/**
 * A default logger implementation that mimics the previous behavior
 */
class DefaultLogger implements LoggerInterface {
    /**
     * @description Log an error message
     * @param {any} message - The message to log
     */
    error (message: any): void {
        if (typeof message === 'object') {
            console.error(JSON.stringify(message, null, 2));
        } else {
            console.error(message);
        }
    }

    /**
     * @description Log a warning message
     * @param {any} message - The message to log
     */
    warn (message: any): void {
        if (typeof message === 'object') {
            console.warn(JSON.stringify(message, null, 2));
        } else {
            console.warn(message);
        }
    }
    /**
     * @description Log an info message
     * @param {any} message - The message to log
     */
    info (message: any): void {
        if (typeof message === 'object') {
            console.info(JSON.stringify(message, null, 2));
        } else {
            console.info(message);
        }
    }

    /**
     * @description Log an http message
     * @param {any} message - The message to log
     */
    http (message: any): void {
        if (typeof message === 'object') {
            console.log(JSON.stringify(message, null, 2));
        } else {
            console.log(message);
        }
    }

    /**
     * @description Log a verbose message
     * @param {any} message - The message to log
     */
    verbose (message: any): void {
        if (typeof message === 'object') {
            console.log(JSON.stringify(message, null, 2));
        } else {
            console.log(message);
        }
    }

    /**
     * @description Log a debug message
     * @param {any} message - The message to log
     */
    debug (message: any): void {
        if (typeof message === 'object') {
            console.debug(JSON.stringify(message, null, 2));
        } else {
            console.debug(message);
        }
    }

    /**
     * @description Log a silly message
     * @param {any} message - The message to log
     */
    silly (message: any): void {
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

    /**
     * Default constructor
     * @param {opts} opts - Options for the logger
     * @param {opts} opts.hideUtc - Hide the UTC timestamp
     * @param {opts} opts.level - The log level
     * @param {opts} opts.name - The name of the logger
     * @param {opts} opts.tz - The timezone
     * @param {opts} opts.logger - The injected logger instance
     */
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
     * @param {any} message - The message to log
     */
    error (message: any): void {
        this.logger.error(message);
    }

    /**
     * @description Log a warning message
     * @param {any} message - The message to log
     */
    warn (message: any): void {
        this.logger.warn(message);
    }

    /**
     * @description Log an info message
     * @param {any} message - The message to log
     */
    info (message: any): void {
        this.logger.info(message);
    }

    /**
     * @description Log an http message
     * @param {any} message - The message to log
     */
    http (message: any): void {
        this.logger.http(message);
    }

    /**
     * @description Log a verbose message
     * @param {any} message - The message to log
     */
    verbose (message: any): void {
        this.logger.verbose(message);
    }

    /**
     * @description Log a debug message
     * @param {any} message - The message to log
     */
    debug (message: any): void {
        this.logger.debug(message);
    }

    /**
     * @description Log a silly message
     * @param {any} message - The message to log
     */
    silly (message: any): void {
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
