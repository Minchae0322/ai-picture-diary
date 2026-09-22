import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  icon: IconName;
  label: string;
  /** 현재값. 없으면 "설정 안 함" - 행을 숨기지 않는다(10 화면 문서 4장). */
  value?: string;
  onPress?: () => void;
};

/** 10 설정 목록의 한 행. */
export function ListRow({ icon, label, value, onPress }: Props) {
  const colors = useColors();
  const spoken = `${label}, ${value ?? '설정 안 함'}`;

  // 아이콘은 라벨과 같은 뜻이라 스크린리더에서 숨긴다(Icon 에 label 을 주지 않는다)
  const content = (
    <View style={styles.row}>
      <View style={styles.left}>
        <Icon name={icon} size={20} color={colors.textMuted} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: colors.textMuted }]}>{value ?? '설정 안 함'} ›</Text>
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={spoken}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: space[3], flexShrink: 1 },
  label: { fontSize: font.base, flexShrink: 1 },
  value: { fontSize: font.sm },
});
