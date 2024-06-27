import { beforeEach, describe, expect, it } from '@jest/globals';
import { V2PacketParser } from './packetParser';
import Long from 'long';
import { V2PropertyRegistration } from '../../types/mqtt-api/mqtt-api-v2';
import { generateRandomNumber } from '../../utils/testResources';

const testPacketParser = new V2PacketParser();
describe('ValidatePropertyValueBoundaries - Primatives', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_primitive',
            format: 'N/A',
            settable: true,
            gettable: true,
            min: 0,
            max: 0,
        };
    });

    it('Throws an error when a number value is less than the min', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([9, 11], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 10');
    });

    it('Throws an error when a number value is greater than the max', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([11, 13], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 12');
    });

    it('Accepts the number value when all values between min and max, or if there is no max or min', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 14;
        expect(testPacketParser.validatePropertyValueBoundaries([11, 12, 13], mockPropertyRegistration)).toEqual([11, 12, 13]);

        mockPropertyRegistration.min = undefined;
        mockPropertyRegistration.max = 12;
        expect(testPacketParser.validatePropertyValueBoundaries([11], mockPropertyRegistration)).toEqual([11]);

        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = undefined;
        expect(testPacketParser.validatePropertyValueBoundaries([11], mockPropertyRegistration)).toEqual([11]);

        mockPropertyRegistration.min = undefined;
        mockPropertyRegistration.max = undefined;
        expect(testPacketParser.validatePropertyValueBoundaries([11], mockPropertyRegistration)).toEqual([11]);
    });

    it('Accepts the number value when equal to min', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(testPacketParser.validatePropertyValueBoundaries([10], mockPropertyRegistration)).toEqual([10]);
    });

    it('Accepts the number value when equal to max', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(testPacketParser.validatePropertyValueBoundaries([12], mockPropertyRegistration)).toEqual([12]);
    });

    it('Throws an error when a long value is less than the min', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('9.12354')], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 10');
    });

    it('Throws an error when a long value is greater than the max', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('12.8473745')], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 12');
    });

    it('Accepts the long value when between min and max', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        const longValue = Long.fromString('11');
        const longValue2 = Long.fromString('11.5');
        expect(testPacketParser.validatePropertyValueBoundaries([longValue, longValue2], mockPropertyRegistration)).toEqual([longValue, longValue2]);

        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = undefined;
        expect(testPacketParser.validatePropertyValueBoundaries([longValue], mockPropertyRegistration)).toEqual([longValue]);

        mockPropertyRegistration.min = undefined;
        mockPropertyRegistration.max = 12;
        expect(testPacketParser.validatePropertyValueBoundaries([longValue], mockPropertyRegistration)).toEqual([longValue]);

        mockPropertyRegistration.min = undefined;
        mockPropertyRegistration.max = undefined;
        expect(testPacketParser.validatePropertyValueBoundaries([longValue], mockPropertyRegistration)).toEqual([longValue]);
    });

    it('Accepts the long value when equal to min', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        const longValue = Long.fromString('10');
        expect(testPacketParser.validatePropertyValueBoundaries([longValue], mockPropertyRegistration)).toEqual([longValue]);
    });

    it('Accepts the long value when equal to max', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        const longValue = Long.fromString('12');
        expect(testPacketParser.validatePropertyValueBoundaries([longValue], mockPropertyRegistration)).toEqual([longValue]);
    });

    it('passes through Boolean and String types', async ()=>{
        mockPropertyRegistration.min = 10;
        mockPropertyRegistration.max = 12;
        expect(testPacketParser.validatePropertyValueBoundaries(['abc'], mockPropertyRegistration)).toEqual(['abc']);
        expect(testPacketParser.validatePropertyValueBoundaries([true], mockPropertyRegistration)).toEqual([true]);
    });
});

describe('ValidatePropertyValueBoundaries - Color', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_color',
            format: 'N/A',
            settable: true,
            gettable: true,
            min: 0,
            max: 0,
        };
    });

    it('Throws an error when there are too few values', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([9], mockPropertyRegistration);
        }).toThrow('Incorrect number of values provided for property type');
    });

    it('Throws an error when a number value is less than the min', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([-1, 10, 20, 30], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 0');
    });

    it('Throws an error when a number value is greater than the max', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([11, 13, 300, 20], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 255');
    });

    it('Accepts the number value when all values between min and max', async ()=>{
        expect(testPacketParser.validatePropertyValueBoundaries([10, 20, 50, 250], mockPropertyRegistration)).toEqual([10, 20, 50, 250]);
    });

    it('Throws an error when a long value is less than the min', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('-1'), Long.fromString('10'), Long.fromString('20'), Long.fromString('30')], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 0');
    });

    it('Throws an error when a long value is greater than the max', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('11'), Long.fromString('13'), Long.fromString('300'), Long.fromString('20')], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 255');
    });

    it('Accepts the long value when all values between min and max', async ()=>{
        expect(testPacketParser.validatePropertyValueBoundaries([Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250')], mockPropertyRegistration)).toEqual([Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250')]);
    });
});

describe('ValidatePropertyValueBoundaries - LED', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_led',
            format: 'N/A',
            settable: true,
            gettable: true,
            min: 0,
            max: 0,
        };
    });

    it('Throws an error when there are too few values', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([9], mockPropertyRegistration);
        }).toThrow('Incorrect number of values provided for property type');
    });

    it('Throws an error when a number value is less than the min', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([5, 10, 20, 30, 200, -1], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 0');
    });

    it('Throws an error when a number value is greater than the max', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([11, 13, 122, 20, 126759217, 31], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 65535');
    });

    it('Accepts the number value when all values between min and max', async ()=>{
        expect(testPacketParser.validatePropertyValueBoundaries([10, 20, 50, 250, 543, 100], mockPropertyRegistration)).toEqual([10, 20, 50, 250, 543, 100]);
    });

    it('Throws an error when a long value is less than the min', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('5'), Long.fromString('10'), Long.fromString('20'), Long.fromString('30'), Long.fromString('200'), Long.fromString('-1')], mockPropertyRegistration);
        }).toThrow('Property value falls below expected minimum of 0');
    });

    it('Throws an error when a long value is greater than the max', async ()=>{
        expect(() => {
            testPacketParser.validatePropertyValueBoundaries([Long.fromString('11'), Long.fromString('13'), Long.fromString('133'), Long.fromString('20'), Long.fromString('126759217'), Long.fromString('31')], mockPropertyRegistration);
        }).toThrow('Property value falls above expected maximum of 65535');
    });

    it('Accepts the long value when all values between min and max', async ()=>{
        expect(testPacketParser.validatePropertyValueBoundaries([Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250'), Long.fromString('543'), Long.fromString('100')], mockPropertyRegistration)).toEqual([Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250'), Long.fromString('543'), Long.fromString('100')]);
    });
});

describe('PrettyPrints Different Json Values as requested for primative type', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_primitive',
            format: 'N/A',
            settable: true,
            gettable: true,
        };
    });

    it('json formats simple primative properly', () => {
        expect(testPacketParser.jsonFormatPropertyValue([[1, 2, 3]], mockPropertyRegistration)).toEqual([1, 2, 3]);
    });
});
describe('PrettyPrints Different Json Values as requested for color type', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_color',
            format: 'N/A',
            settable: true,
            gettable: true,
        };
    });

    it('color property throws error when provided incorrect number of values ', () => {
        expect(()=>{
            testPacketParser.jsonFormatPropertyValue([[1, 2, 3]], mockPropertyRegistration);
        }).toThrow('Incorrect number of values provided for JSON formatting');
    });

    it('color property pretty prints json when provided correct number of values ', () => {
        const white = generateRandomNumber(255);
        const red = generateRandomNumber(255);
        const green = generateRandomNumber(255);
        const blue = generateRandomNumber(255);
        expect(testPacketParser.jsonFormatPropertyValue([[white, red, green, blue]], mockPropertyRegistration)).toEqual([{
            white,
            red,
            green,
            blue,
        }]);
    });
});

describe('PrettyPrints Different Json Values as requested for led type', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(()=>{
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_led',
            format: 'N/A',
            settable: true,
            gettable: true,
        };
    });

    it('led property throws error when provided incorrect number of values ', () => {
        expect(()=>{
            testPacketParser.jsonFormatPropertyValue([[1, 2, 3]], mockPropertyRegistration);
        }).toThrow('Incorrect number of values provided for JSON formatting');
    });

    it('led property pretty prints json when provided correct number of values ', () => {
        const red = generateRandomNumber(255);
        const green = generateRandomNumber(255);
        const blue = generateRandomNumber(255);
        const white = generateRandomNumber(255);
        const index = generateRandomNumber(65535);
        const brightness = generateRandomNumber(255);
        expect(testPacketParser.jsonFormatPropertyValue([[red, green, blue, white, index, brightness]], mockPropertyRegistration)).toEqual([{
            red,
            green,
            blue,
            white,
            index,
            brightness,
        }]);
    });
});
