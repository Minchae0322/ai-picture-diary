// 시안 SVG를 컴포넌트로 import하기 위한 설정.
// 에셋을 코드로 다시 그리지 않고 Figma가 내보낸 파일 그대로 쓴다(figma-workflow 3장).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
