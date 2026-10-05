import { useColorScheme } from 'react-native';
import { colorsFor, emotionColorsFor, type Colors, type EmotionColors } from './tokens';

/** 다크 모드는 의미 토큰 교체로만 처리한다. 컴포넌트에 isDark 분기를 만들지 않는다. */
export function useColors(): Colors {
  return colorsFor(useColorScheme());
}

/** 감정 색은 과일에서 뽑은 값이라 스킴과 무관하게 같다. 모양만 의미 토큰과 맞춰 둔다. */
export function useEmotionColors(): EmotionColors {
  return emotionColorsFor(useColorScheme());
}
