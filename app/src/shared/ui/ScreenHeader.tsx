import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

/** 시안 05~10의 상단 타이틀. 뒤로가기가 있는 화면(04·07·09)만 onBack 을 준다. */
export function ScreenHeader({ title, subtitle, onBack }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
            hitSlop={space[2]}
            style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={{ color: colors.text, fontSize: font.lg }}>←</Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  back: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  title: { fontSize: font.xl, fontWeight: font.weightBold },
  subtitle: { fontSize: font.sm },
});
