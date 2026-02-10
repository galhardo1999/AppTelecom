module.exports = function (api) {
    api.cache.using(() => process.env.NODE_ENV);
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
        plugins: [
            'react-native-reanimated/plugin',
            !isDevelopment && 'transform-remove-console',
        ].filter(Boolean),
    };
};
