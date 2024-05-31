module.exports = {
    modulePaths: ['/shared/vendor/modules/'],
    moduleFileExtensions: ['js', 'jsx'],
    moduleDirectories: ['node_modules', 'bower_components', 'shared'],

    moduleNameMapper: {
        '^config$': '<rootDir>/configs/app-config.js',
    },
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
        '^.+\\.ne$': 'jest-transform-nearley',
    },
};
