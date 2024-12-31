const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .ttf files (used by react-native-vector-icons)
config.resolver.assetExts.push('ttf');

// Add this configuration to resolve the nanoid issue
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;