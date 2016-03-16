require('nekodev').gulp({
    browser: false,
    jest: {
        config: {
            unmockedModulePathPatterns: [
                '<rootDir>/node_modules/depd',
                '<rootDir>/node_modules/lodash',
                '<rootDir>/node_modules/sshpk',
            ],
        },
    },
});
