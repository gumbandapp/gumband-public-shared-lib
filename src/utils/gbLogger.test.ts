/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as winston from 'winston';
import { GbLogger } from './gbLogger';

describe('GbLogger', () => {
    let logger: GbLogger;
    beforeEach(() => {
        logger = new GbLogger();
    });

    it('should initialize with default options: info log level with one console logging transport', () => {
        expect(logger).toBeDefined();
        expect((logger as any).logger).toBeInstanceOf(winston.Logger);
        expect((logger as any).logger.transports).toHaveLength(1);
        expect((logger as any).logger.transports[0]).toBeInstanceOf(winston.transports.Console);
        expect((logger as any).logger.level).toBe('info');
    });

    it('should throw an error for invalid timezone.', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        new GbLogger({ tz: 'Invalid/Timezone' });
        expect(console.error).toHaveBeenCalled();
        jest.restoreAllMocks();
    });

    it('should allow transports to be added using addTransport', () => {
        const transport = new winston.transports.Console();
        logger.addTransport(transport);
        expect((logger as any).logger.transports).toContain(transport);
    });

    it('should remove a transport', () => {
        const transport = new winston.transports.Console();
        logger.addTransport(transport);
        expect((logger as any).logger.transports).toContain(transport);
        logger.removeTransport(transport);
        expect((logger as any).logger.transports).not.toContain(transport);
    });

    it('should log error messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'error').mockImplementation(() => {});
        logger.error('Test error message');
        expect(spy).toHaveBeenCalledWith('Test error message');
    });

    it('should log warn messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'warn').mockImplementation(() => { });
        logger.warn('Test warn message');
        expect(spy).toHaveBeenCalledWith('Test warn message');
    });

    it('should log info messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'info').mockImplementation(() => { });
        logger.info('Test info message');
        expect(spy).toHaveBeenCalledWith('Test info message');
    });

    it('should log http messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'http').mockImplementation(() => { });
        logger.http('Test http message');
        expect(spy).toHaveBeenCalledWith('Test http message');
    });

    it('should log verbose messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'verbose').mockImplementation(() => { });
        logger.verbose('Test verbose message');
        expect(spy).toHaveBeenCalledWith('Test verbose message');
    });

    it('should log debug messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'debug').mockImplementation(() => { });
        logger.debug('Test debug message');
        expect(spy).toHaveBeenCalledWith('Test debug message');
    });

    it('should log silly messages', () => {
        const spy = jest.spyOn((logger as any).logger, 'silly').mockImplementation(() => { });
        logger.silly('Test silly message');
        expect(spy).toHaveBeenCalledWith('Test silly message');
    });
});
