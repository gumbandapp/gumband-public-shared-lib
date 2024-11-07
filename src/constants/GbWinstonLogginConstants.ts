import { LOG_LEVELS } from './LogLevels';

const hideUtc = false;
const level = LOG_LEVELS.INFO;
const name = '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transports: any[] = []; // We don't know what transports will be added
const tz = 'UTC';

export const GbWinstonLoggingConstants = {
    hideUtc,
    level,
    name,
    transports,
    tz,
};
