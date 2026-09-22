import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Badge } from '../api/badgeApi';

/** 07 뱃지 그리드 3열. 잠금 뱃지는 조건은 보이되 그림은 자물쇠로 가린다. */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {badges.map((badge) => (
        <View
          key={badge.code}
          accessible
          accessibilityLabel={`${badge.name}, ${badge.condition}, ${badge.earned ? '획득' : '잠김'}`}
          style={[
            styles.cell,
            {
              backgroundColor: colors.surface,
              borderColor: badge.earned ? colors.primary : colors.border,
              opacity: badge.earned ? 1 : 0.6,
            },
          ]}
        >
          <View
            style={[
              styles.icon,
              { backgroundColor: badge.earned ? colors.primary : colors.border },
            ]}
          >
            <Icon
              name={badge.earned ? 'candy' : 'lock'}
              size={22}
              color={badge.earned ? colors.primaryFg : colors.textMuted}
            />
          </View>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {badge.name}
          </Text>
          <Text numberOfLines={1} style={[styles.condition, { color: colors.textMuted }]}>
            {badge.condition}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  cell: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: space[1],
    paddingVertical: space[4],
    paddingHorizontal: space[2],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: font.sm, fontWeight: font.weightBold },
  condition: { fontSize: font.xs },
});
