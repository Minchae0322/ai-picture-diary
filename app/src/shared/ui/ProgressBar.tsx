import { StyleSheet, View } from 'react-native';
import { radius } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  /** 0~1 */
  value: number;
  height?: number;
  /** 스크린리더용. "12 / 40개 수집"처럼 숫자를 그대로 읽어 준다 */
  label: string;
};

/** 시안 03의 생성 진행, 07의 수집 진행이 같은 모양이다 */
export function ProgressBar({ value, height = 8, label }: Props) {
  const colors = useColors();
  const ratio = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.track }]}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.full },
});
