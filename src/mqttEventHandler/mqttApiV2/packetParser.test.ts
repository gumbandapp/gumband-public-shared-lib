import { beforeEach, describe, expect, it } from '@jest/globals';
import { V2PacketParser } from './packetParser';
import Long from 'long';
import { V2PropertyRegistration } from '../../types/mqtt-api/mqtt-api-v2';
import { generateRandomNumber } from '../../utils/testResources';
import struct, { DataType } from 'python-struct';

const testPacketParser = new V2PacketParser();

describe('ValidatePropertyValueBoundaries', () => {
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
                testPacketParser.validatePropertyValueBoundaries([126759217, 11, 13, 122, 20, 31], mockPropertyRegistration);
            }).toThrow('Property value falls above expected maximum of 65535');
        });

        it('Accepts the number value when all values between min and max', async ()=>{
            expect(testPacketParser.validatePropertyValueBoundaries([543, 100, 10, 20, 50, 250], mockPropertyRegistration)).toEqual([543, 100, 10, 20, 50, 250]);
        });

        it('Throws an error when a long value is less than the min', async ()=>{
            expect(() => {
                testPacketParser.validatePropertyValueBoundaries([Long.fromString('5'), Long.fromString('10'), Long.fromString('20'), Long.fromString('30'), Long.fromString('200'), Long.fromString('-1')], mockPropertyRegistration);
            }).toThrow('Property value falls below expected minimum of 0');
        });

        it('Throws an error when a long value is greater than the max', async ()=>{
            expect(() => {
                testPacketParser.validatePropertyValueBoundaries([Long.fromString('126759217'), Long.fromString('11'), Long.fromString('13'), Long.fromString('133'), Long.fromString('20'), Long.fromString('31')], mockPropertyRegistration);
            }).toThrow('Property value falls above expected maximum of 65535');
        });

        it('Accepts the long value when all values between min and max', async ()=>{
            expect(testPacketParser.validatePropertyValueBoundaries([Long.fromString('543'), Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250'), Long.fromString('100')], mockPropertyRegistration)).toEqual([Long.fromString('543'), Long.fromString('10'), Long.fromString('20'), Long.fromString('50'), Long.fromString('250'), Long.fromString('100')]);
        });
    });
});

describe('parsePropertyValue', () => {
    let mockPropertyRegistration: V2PropertyRegistration;
    beforeEach(() => {
        mockPropertyRegistration = {
            path: '',
            index: 0,
            length: 1,
            type: 'gmbnd_primitive',
            format: 'B',
            settable: true,
            gettable: true,
            min: 0,
            max: 255,
        };
    });

    it('should return 2D array', () => {
        const packedData = struct.pack('B', 1);

        const actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);

        expect(Array.isArray(actualUnpackedData)).toEqual(true);
        expect(Array.isArray(actualUnpackedData[0])).toEqual(true);
        expect(actualUnpackedData).toEqual([[1]]);
    });

    describe('when format is string', () => {
        beforeEach(() => {
            mockPropertyRegistration.format = 's';
        });

        it('should return string of length <= registration.length', () => {
            const expectedString = 'stub-string';
            const packedData = Buffer.from(expectedString);

            let actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);
            expect(actualUnpackedData).toEqual([['s']]);

            mockPropertyRegistration.length = expectedString.length;
            actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);
            expect(actualUnpackedData).toEqual([[expectedString]]);

            mockPropertyRegistration.length = expectedString.length + 5;
            actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);
            expect(actualUnpackedData).toEqual([[expectedString]]);
        });
    });

    describe('when format is not string', () => {
        it('should split values into arrays and truncate based on format and length', () => {
            const packedData = struct.pack('BBBB', [1, 2, 3, 4]);

            let actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);

            expect(actualUnpackedData.length).toEqual(1);
            expect(actualUnpackedData).toEqual([[1]]);

            mockPropertyRegistration.length = 4;
            actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);

            expect(actualUnpackedData.length).toEqual(4);
            expect(actualUnpackedData).toEqual([[1], [2], [3], [4]]);

            mockPropertyRegistration.length = 2;
            mockPropertyRegistration.format = 'BB';
            actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);

            expect(actualUnpackedData.length).toEqual(2);
            expect(actualUnpackedData).toEqual([[1, 2], [3, 4]]);

            mockPropertyRegistration.format = 'B';
            actualUnpackedData = testPacketParser.parsePropertyValue(packedData, mockPropertyRegistration);

            expect(actualUnpackedData.length).toEqual(2);
            expect(actualUnpackedData).toEqual([[1], [2]]);
        });
    });
});

describe('jsonFormatPropertyValue', () => {
    describe('PrettyPrints Different Json Values as requested for primitive type', () => {
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

        it('json formats simple primitive properly', () => {
            const expectedFormattedValue = [1, 2, 3];

            const stubUnpackedValue = [expectedFormattedValue]; // 2D Array

            expect(testPacketParser.jsonFormatPropertyValue(stubUnpackedValue, mockPropertyRegistration)).toEqual(expectedFormattedValue);
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
            expect(testPacketParser.jsonFormatPropertyValue([[index, brightness, white, red, green, blue]], mockPropertyRegistration)).toEqual([{
                red,
                green,
                blue,
                white,
                index,
                brightness,
            }]);
        });
    });
});

describe('unpackJsonPropertyValue', () => {
    describe('when propertyRegistration.type is "gmbnd_primitive"', () => {
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

        describe('when propertyRegistration is "gmbnd_primitive"', () => {
            describe('when format is "s"', () => {
                beforeEach(() => {
                    mockPropertyRegistration.format = 's';
                    mockPropertyRegistration.length = 100;
                });

                it('should return the first value wrapped in another array when the first element is a string', () => {
                    const stubStringValue = 'stub-string';
                    expect(testPacketParser.unpackJsonPropertyValue([stubStringValue], mockPropertyRegistration)).toEqual([[stubStringValue]]);
                });

                it('should ignore additional values in another array', () => {
                    const stubStringValue = 'stub-string';
                    expect(testPacketParser.unpackJsonPropertyValue([stubStringValue, 2, true, 'another-string'], mockPropertyRegistration)).toEqual([[stubStringValue]]);
                });

                it('should truncate string length to registered length if passed in value is too long', () => {
                    const stubStringValue = 'stub-string';
                    mockPropertyRegistration.length = 4;
                    expect(testPacketParser.unpackJsonPropertyValue([stubStringValue], mockPropertyRegistration)).toEqual([[stubStringValue.substring(0, 4)]]);
                });
            });

            it('should wrap all primitive values in sub arrays', () => {
                const stubPrimitiveValues = [1, 2, 3, 4];
                mockPropertyRegistration.length = 4;
                expect(testPacketParser.unpackJsonPropertyValue(stubPrimitiveValues, mockPropertyRegistration)).toEqual([[1], [2], [3], [4]]);
            });
        });

        describe('when propertyRegistration is "gmbnd_color"', () => {
            beforeEach(() => {
                mockPropertyRegistration.type = 'gmbnd_color';
            });

            it('should return an 2D array of the Object.values(value) in the correct format order', () => {
                const expectedUnpackedData = [[0, 1, 2, 3]];

                const stubGumbandColorValue: Record<string, DataType> = {
                    red: 1,
                    blue: 3,
                    green: 2,
                    white: 0,
                };

                const actualUnpackedData = testPacketParser.unpackJsonPropertyValue([stubGumbandColorValue], mockPropertyRegistration);

                expect(actualUnpackedData).toEqual(expectedUnpackedData);
            });

            it('should return an 2D array of the Object.values(value) in the correct format order', () => {
                const expectedUnpackedData = [[0, 1, 2, 3], [4, 5, 6, 7]];

                const stubGumbandColorValue1: Record<string, DataType> = {
                    red: 1,
                    blue: 3,
                    green: 2,
                    white: 0,
                };

                const stubGumbandColorValue2: Record<string, DataType> = {
                    blue: 7,
                    red: 5,
                    white: 4,
                    green: 6,
                };

                const actualUnpackedData = testPacketParser.unpackJsonPropertyValue([stubGumbandColorValue1, stubGumbandColorValue2], mockPropertyRegistration);

                expect(actualUnpackedData).toEqual(expectedUnpackedData);
            });
        });
    });
});

describe('packPropertyValue', () => {
    describe('when format is string', () => {
        it('should return a buffer of the full string given when no length is specified in the format', () => {
            const stubString = 'stub-string';
            expect(testPacketParser.packPropertyValue('s', [[stubString]])).toEqual(Buffer.from(stubString));
        });

        it('should return a buffer of the trimmed string when format includes length', () => {
            const stubString = 'stub-string';
            expect(testPacketParser.packPropertyValue('4s', [[stubString]])).toEqual(Buffer.from('stub'));
        });

        it('should throw a TypeError the first element of values[0] is not a string', () => {
            expect(() => testPacketParser.packPropertyValue('s', [[11]])).toThrow(new TypeError('values[0][0] is not a string'));
            expect(() => testPacketParser.packPropertyValue('s', [[true]])).toThrow(new TypeError('values[0][0] is not a string'));
            expect(() => testPacketParser.packPropertyValue('s', [[Long.fromInt(65555)]])).toThrow(new TypeError('values[0][0] is not a string'));
        });
    });

    describe('when format is not string', () => {
        it('should return concatenate all property values into a single Buffer', () => {
            let expectedPackedData = struct.pack('B', [1]);

            let actualUnpackedData = testPacketParser.packPropertyValue('B', [[1]]);

            expect(actualUnpackedData.length).toEqual(struct.sizeOf('B'));
            expect(actualUnpackedData).toEqual(expectedPackedData);

            expectedPackedData = struct.pack('BBBB', [1, 2, 3, 4]);

            actualUnpackedData = testPacketParser.packPropertyValue('B', [[1], [2], [3], [4]]);

            expect(actualUnpackedData.length).toEqual(struct.sizeOf('BBBB'));
            expect(actualUnpackedData).toEqual(expectedPackedData);

            actualUnpackedData = testPacketParser.packPropertyValue('BB', [[1, 2], [3, 4]]);

            expect(actualUnpackedData.length).toEqual(struct.sizeOf('BBBB'));
            expect(actualUnpackedData).toEqual(expectedPackedData);

            actualUnpackedData = testPacketParser.packPropertyValue('BBBB', [[1, 2, 3, 4]]);

            expect(actualUnpackedData.length).toEqual(struct.sizeOf('BBBB'));
            expect(actualUnpackedData).toEqual(expectedPackedData);
        });
    });
});

describe('Parse log', ()=>{
    it('should return the log when all properties are valid', async ()=>{
        const testLog = { severity: 'debug', text: 'testLog' };
        const testBuffer = Buffer.from(JSON.stringify(testLog));

        expect(await testPacketParser.parseLog(testBuffer)).toEqual(testLog);
    });

    it('should throw an error if severity is missing', async ()=>{
        const testLog = { text: 'testLog' };
        const testBuffer = Buffer.from(JSON.stringify(testLog));
        await expect(testPacketParser.parseLog(testBuffer))
            .rejects
            .toThrow('log severity must be declared');
    });

    it('should throw an error if severity is wrong type', async ()=>{
        const testLog = { severity: 'consolelog', text: 'testLog' };
        const testBuffer = Buffer.from(JSON.stringify(testLog));
        await expect(testPacketParser.parseLog(testBuffer))
            .rejects
            .toThrow('log severity must be of a known level');
    });

    it('should throw an error if text is not a string', async ()=>{
        const testLog = { severity: 'debug', text: 1 };
        const testBuffer = Buffer.from(JSON.stringify(testLog));
        await expect(testPacketParser.parseLog(testBuffer))
            .rejects
            .toThrow('log message must be a string');
    });
});
