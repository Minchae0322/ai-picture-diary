import { useColorScheme } from 'react-native';
import { colorsFor, type Colors } from './tokens';

/** 다크 모드는 의미 토큰 교체로만 처리한다. 컴포넌트에 isDark 분기를 만들지 않는다. */
export function useColors(): Colors {
  return colorsFor(useColorScheme());
}
