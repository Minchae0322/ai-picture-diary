import { useColorScheme } from 'react-native';
import { colorsFor, weatherColorsFor, type Colors, type WeatherColors } from './tokens';

/** 다크 모드는 의미 토큰 교체로만 처리한다. 컴포넌트에 isDark 분기를 만들지 않는다. */
export function useColors(): Colors {
  return colorsFor(useColorScheme());
}

/** 날씨 색은 의미 토큰과 같은 방식으로 스킴에 따라 통째로 갈린다. */
export function useWeatherColors(): WeatherColors {
  return weatherColorsFor(useColorScheme());
}
