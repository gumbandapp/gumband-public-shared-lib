import { ObjectValues } from '../utils/usefulTS';

export const LOG_LEVELS = {
    // MOST SEVERE
    'ERROR': 'error',
    'WARN': 'warn',
    'INFO': 'info',
    'HTTP': 'http',
    'VERBOSE': 'verbose',
    'DEBUG': 'debug',
    'SILLY': 'silly',
    // LEAST SEVERE
} as const;

export type LogLevelType = ObjectValues<typeof LOG_LEVELS>;
