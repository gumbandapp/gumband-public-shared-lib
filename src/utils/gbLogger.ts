/* eslint-disable @typescript-eslint/no-explicit-any */
import moment from 'moment-timezone';
import winston, { Logger as WinstonLogger, transports as WinstonTransports } from 'winston';
import { type LogLevelType, LOG_LEVELS } from '../constants/LogLevels';

export type VariousWinstonTransportInstancesArray = (
    WinstonTransports.ConsoleTransportInstance |
    WinstonTransports.FileTransportInstance |
    WinstonTransports.HttpTransportInstance |
    WinstonTransports.StreamTransportInstance)[];

export type GbLoggerConstructorObjectOpts = {
    hideUtc?: boolean
    level?: LogLevelType;
    name?: string;
    transports?: VariousWinstonTransportInstancesArray;
    tz?: string; // A timezone string, when omitted timestamps will be UTC
};


export interface LoggerInterface {
    error: (message: any) => void;
    warn: (message: any) => void;
    info: (message: any) => void;
    http: (message: any) => void;
    verbose: (message: any) => void;
    debug: (message: any) => void;
    silly: (message: any) => void;
}
/**
 * A logger class that wraps winston
 */
export class GbLogger implements LoggerInterface {
    private logger: WinstonLogger;

    /**
     * Default constructor
     * @param {opts} opts - Options for the logger
     * @param {string} opts.name - A short name for the logger to be printed with each log message
     * @param {string} [opts.level='info'] - The default log level for this logger, see https://github.com/winstonjs/winston?tab=readme-ov-file#logging-levels
     * @param {string} [opts.tz='UTC'] - The timezone identifier. See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for valid values
     * @param {boolean} [opts.hideUtc=false] - If true, the UTC timestamp will not be printed in the log message
     * @param {VariousWinstonTransportInstancesArray} [opts.transports=[]] - Additional winston transports to add during instantiation
     */
    constructor (opts?: GbLoggerConstructorObjectOpts) {
        // Create a default console transport

        const hideUtc = opts?.hideUtc || false;
        const level = opts?.level || LOG_LEVELS.INFO;
        const name = opts?.name || '';
        const transports = opts?.transports || [];
        const tz = opts?.tz || 'UTC';

        // Check that TZ is one that moment-timezone can handle
        if (!moment.tz.names().includes(tz)) {
            // eslint-disable-next-line no-console -- This is a logger, so console is fine
            console.error(`Invalid timezone: ${tz}, see: https://github.com/moment/moment-timezone/blob/develop/data/packed/latest.json for valid values`);
        }

        // Create the default console transport that will be loaded into the logger
        const gbDefaultConsoleTransport = new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.label({ label: name }),
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, label }) => {
                    const localTime = moment(timestamp).tz(tz).format('YYYY-MM-DD HH:mm:ss z');
                    const utcTime = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss [UTC]');
                    const utcFormatted = `(${utcTime}) `;
                    const maybeUtcValue = hideUtc ? '' : utcFormatted;
                    const maybeLabelValue = label ? `[${label}] ` : '';
                    if (utcTime === 'Invalid date' || tz === 'UTC') {
                        return `${maybeUtcValue}${maybeLabelValue}${level}: ${message}`;
                    } else {
                        return `${localTime} ${maybeUtcValue}[${label}] ${level}: ${message}`;
                    }
                }),
            ),
        });

        // Create the logger instance with default and additional transports
        this.logger = winston.createLogger({
            level: level || 'info',
            levels: winston.config.npm.levels,
            transports: [gbDefaultConsoleTransport, ...transports],
        });
    }

    /**
     * Add a new transport to the logger
     *
     * @param {any} transport - A winston transport instance
     */
    addTransport (transport: any): void {
        this.logger.add(transport);
    }

    /**
     * Remove a transport from the logger
     *
     * @param {any} transport - A winston transport instance
     */
    removeTransport (transport: any): void {
        this.logger.remove(transport);
    }

    /**
     * Send an error log
     *
     * @param {*} message - Whatever you'd like to log
     */
    error (message: any): void {
        this.logger.error(message);
    }
    /**
     * Send a warn log
     *
     * @param {*} message - Whatever you'd like to log
     */
    warn (message: any): void {
        this.logger.warn(message);
    }

    /**
     * Send an info log
     *
     * @param {*} message - Whatever you'd like to log
     */
    info (message: any): void {
        this.logger.info(message);
    }

    /**
     *
     * @param {*} message - Whatever you'd like to log
     */
    http (message: any): void {
        this.logger.http(message);
    }

    /**
     * Send a verbose log
     *
     * @param {*} message - Whatever you'd like to log
     */
    verbose (message: any): void {
        this.logger.verbose(message);
    }

    /**
     * Send a debug log
     *
     * @param {*} message - Whatever you'd like to log
     */
    debug (message: any): void {
        this.logger.debug(message);
    }

    /**
     *
     * @param {*} message - Whatever you'd like to log
     */
    silly (message: any): void {
        this.logger.silly(message);
    }
}
