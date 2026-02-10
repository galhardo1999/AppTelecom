module.exports = function (api) {
    api.cache(true);
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
        plugins: [
            'react-native-reanimated/plugin',
            !api.env('development') && 'transform-remove-console',
        ].filter(Boolean),
    };
};
