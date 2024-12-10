// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional asset extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  // Add other asset extensions here if needed
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp'
);

module.exports = wrapWithReanimatedMetroConfig(config);