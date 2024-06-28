module.exports = {
    preset: 'ts-jest', // Tells jest to use ts-jest for testing typescript code.
    testEnvironment: 'node', // sets the env to mimic nodeJS
    coverageThreshold: {
        global: {
            statements: 14, // Measures the percentage of source statements that are executed during testing.
            branches: 15, // Measures the percentage of decision points (e.g., if, switch cases) that have been executed.
            functions: 7, // Measures the percentage of functions that have been called during testing.
            lines: 14, // Line coverage: Measures the percentage of lines that were executed during testing.
        },
    },
    collectCoverageFrom: ['src/**/*.ts'],
};
