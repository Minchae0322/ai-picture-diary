import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 02 "14일 연속". 0일이면 배지 자체를 숨긴다(02 화면 문서 5장). */
export function StreakBadge({ days }: { days: number }) {
  const colors = useColors();
  if (days <= 0) {
    return null;
  }
  return (
    <View accessible accessibilityLabel={`연속 기록 ${days}일`} style={[styles.badge, { backgroundColor: colors.primary }]}>
      <Icon name="flame" size={14} color={colors.primaryFg} />
      <Text style={[styles.text, { color: colors.primaryFg }]}>{days}일 연속</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
  },
  text: { fontSize: font.xs, fontWeight: font.weightBold },
});
