import { Image, StyleSheet } from 'react-native';
import { EMOTION_IMAGE, EMOTION_SCALE, emotionLabel, type Emotion } from '@/shared/emotion';

type Props = {
  emotion: Emotion;
  size?: number;
  /** 그림이 유일한 정보일 때만 준다. 옆에 같은 뜻의 글자가 있으면 생략해 중복 낭독을 막는다. */
  label?: boolean;
};

/**
 * 감정 캐릭터 그림. `Icon.tsx` 의 SVG 아이콘과 달리 **그림 자산**이라 여기서 따로 다룬다.
 *
 * 자산은 잉크 경계로 잘려 긴 변이 캔버스를 채운다. 거기에 감정별 배율(`EMOTION_SCALE`)을 곱해
 * 세로로 긴 캐릭터가 작아 보이는 것을 메운다. **`size` 는 기준값이고 실제 변은 그보다 클 수 있다** -
 * 담는 상자에 그만큼 여유를 둔다.
 */
export function EmotionFace({ emotion, size = 28, label = false }: Props) {
  const side = Math.round(size * EMOTION_SCALE[emotion]);
  const a11y = label
    ? { accessibilityRole: 'image' as const, accessibilityLabel: emotionLabel(emotion) }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  return (
    <Image
      source={EMOTION_IMAGE[emotion]}
      style={[styles.art, { width: side, height: side }]}
      resizeMode="contain"
      {...a11y}
    />
  );
}

const styles = StyleSheet.create({
  art: { flex: 0 },
});
