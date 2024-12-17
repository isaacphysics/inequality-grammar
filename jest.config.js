module.exports = {
    modulePaths: ['/shared/vendor/modules/'],
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    moduleDirectories: ['node_modules', 'bower_components', 'shared'],

    moduleNameMapper: {
        '^config$': '<rootDir>/configs/app-config.js',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx|)$': 'babel-jest',
        '^.+\\.ne$': 'jest-transform-nearley',
    },
};
