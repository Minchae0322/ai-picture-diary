import { StyleSheet, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  /** 0 ~ 1 */
  value: number;
  height?: number;
  accessibilityLabel: string;
};

/** prototype.html `.bar-track`. 07 뱃지 수집률이 쓴다. */
export function ProgressBar({ value, height = 8, accessibilityLabel }: Props) {
  const colors = useColors();
  const ratio = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.track }]}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
});
