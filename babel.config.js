module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated v4 — worklets are transformed by react-native-worklets.
    // This plugin MUST be last so it runs after all other transforms.
    plugins: ['react-native-worklets/plugin'],
  };
};
