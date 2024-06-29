import { describe, expect, it } from '@jest/globals';
import { generateRandomNumber } from './testResources';

describe('generateRandomNumber', () => {
    it('should return a number between the given the max and min params', () => {
        expect(generateRandomNumber(1, 1)).toEqual(1);

        const actual3to1 = generateRandomNumber(3, 1);
        expect((actual3to1 <= 3 && actual3to1 >= 1)).toBe(true);
    });
});
