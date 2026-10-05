import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 시안 04의 "← 2026.08.24", 07·09의 뒤로가기. 라벨이 없으면 화살표만 */
export function BackLink({ label }: { label?: string }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={label === undefined ? '뒤로' : `뒤로, ${label}`}
      hitSlop={space[2]}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>
        ←{label === undefined ? '' : ` ${label}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignSelf: 'flex-start' },
  label: { fontSize: font.base, fontFamily: font.medium },
});
