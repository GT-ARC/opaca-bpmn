module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(bpmn-js|diagram-js)/)', // This can be customized to transpile specific node_modules
    ],
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
};
