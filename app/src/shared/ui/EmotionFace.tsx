import { Image, StyleSheet } from 'react-native';
import { EMOTION_IMAGE, emotionLabel, type Emotion } from '@/shared/emotion';

type Props = {
  emotion: Emotion;
  size?: number;
  /** 그림이 유일한 정보일 때만 준다. 옆에 같은 뜻의 글자가 있으면 생략해 중복 낭독을 막는다. */
  label?: boolean;
};

/**
 * 감정 캐릭터 그림. `Icon.tsx` 의 SVG 아이콘과 달리 **그림 자산**이라 여기서 따로 다룬다.
 *
 * 원본이 정사각이고 캐릭터가 그 안에 여백째로 들어 있어, 크기를 정사각으로 주고
 * `contain` 으로 맞추면 과일마다 다른 비율이 저절로 지켜진다.
 */
export function EmotionFace({ emotion, size = 24, label = false }: Props) {
  const a11y = label
    ? { accessibilityRole: 'image' as const, accessibilityLabel: emotionLabel(emotion) }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  return (
    <Image
      source={EMOTION_IMAGE[emotion]}
      style={[styles.art, { width: size, height: size }]}
      resizeMode="contain"
      {...a11y}
    />
  );
}

const styles = StyleSheet.create({
  art: { flex: 0 },
});
