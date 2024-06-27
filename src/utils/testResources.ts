/**
 * generate a random integer between given min and max.
 * @param {number} [max=10000] - maximum possible generated value
 * @param {number} [min=0] - minimum possible generated value
 * @return {number} random number
 */
export function generateRandomNumber (max: number = 10000, min: number = 0): number {
    const randMax = max - min + 1;
    return Math.floor(Math.random() * randMax) + min;
}
