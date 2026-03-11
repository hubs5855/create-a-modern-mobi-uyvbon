
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@style': './style',
            '@hooks': './hooks',
            '@types': './types',
            '@contexts': './contexts',
            '@lib': './lib',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
