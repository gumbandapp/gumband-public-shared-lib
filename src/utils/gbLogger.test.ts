/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest } from '@jest/globals';
import * as winston from 'winston';
import { GbLogger } from './gbLogger';

describe('GbLogger', () => {
    it('should initialize with default options: info log level with one console logging transport', () => {
        expect(GbLogger).toBeDefined();
        expect((GbLogger as any).logger).toBeInstanceOf(winston.Logger);
        expect((GbLogger as any).logger.transports).toHaveLength(1);
        expect((GbLogger as any).logger.transports[0]).toBeInstanceOf(winston.transports.Console);
        expect((GbLogger as any).logger.level).toBe('info');
    });

    it('should throw an error for invalid timezone.', () => {
        const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        GbLogger.configureLogger({ tz: 'Invalid/Timezone' });
        expect(consoleErrSpy).toHaveBeenCalled();
        jest.restoreAllMocks();
    });

    it('should allow transports to be added using addTransport', () => {
        const transport = new winston.transports.Console();
        GbLogger.addTransport(transport);
        expect((GbLogger as any).logger.transports).toContain(transport);
    });

    it('should remove a transport', () => {
        const transport = new winston.transports.Console();
        GbLogger.addTransport(transport);
        expect((GbLogger as any).logger.transports).toContain(transport);
        GbLogger.removeTransport(transport);
        expect((GbLogger as any).logger.transports).not.toContain(transport);
    });

    it('should log error messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'error').mockImplementation(() => {});
        GbLogger.error('Test error message');
        expect(spy).toHaveBeenCalledWith('Test error message');
    });

    it('should log warn messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'warn').mockImplementation(() => { });
        GbLogger.warn('Test warn message');
        expect(spy).toHaveBeenCalledWith('Test warn message');
    });

    it('should log info messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'info').mockImplementation(() => { });
        GbLogger.info('Test info message');
        expect(spy).toHaveBeenCalledWith('Test info message');
    });

    it('should log http messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'http').mockImplementation(() => { });
        GbLogger.http('Test http message');
        expect(spy).toHaveBeenCalledWith('Test http message');
    });

    it('should log verbose messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'verbose').mockImplementation(() => { });
        GbLogger.verbose('Test verbose message');
        expect(spy).toHaveBeenCalledWith('Test verbose message');
    });

    it('should log debug messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'debug').mockImplementation(() => { });
        GbLogger.debug('Test debug message');
        expect(spy).toHaveBeenCalledWith('Test debug message');
    });

    it('should log silly messages', () => {
        const spy = jest.spyOn((GbLogger as any).logger, 'silly').mockImplementation(() => { });
        GbLogger.silly('Test silly message');
        expect(spy).toHaveBeenCalledWith('Test silly message');
    });
});
