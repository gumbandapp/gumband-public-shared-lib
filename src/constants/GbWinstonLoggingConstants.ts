import { LOG_LEVELS } from './LogLevels';

const hideUtc = false as const;
const level = LOG_LEVELS.INFO;
const name = '' as const;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transports: unknown[] = [];
// 👆 Technically these should be winston transports, but the type isn't available to us
// because we're not using winston directly in this module. We're just defining constants.
const tz = 'UTC' as const;

export const GbWinstonLoggingConstants = {
    hideUtc,
    level,
    name,
    transports,
    tz,
} as const;
