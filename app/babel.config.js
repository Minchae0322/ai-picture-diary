/**
 * Reanimated 4 는 **바벨 플러그인이 있어야** 돈다. 워크릿(UI 스레드에서 실행되는 함수)을
 * 컴파일 단계에서 변환하기 때문이다. 없으면 "react-native-reanimated is not installed" 로 뜬다.
 *
 * <p>플러그인은 **항상 마지막**에 와야 한다(공식 문서). 이 파일이 생기기 전까지는 Expo 기본 프리셋만
 * 쓰고 있었다 - Skia 를 들이면서 reanimated 가 따라왔고, 그래서 이 설정이 필요해졌다.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
