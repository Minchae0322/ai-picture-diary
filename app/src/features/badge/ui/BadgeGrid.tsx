import { StyleSheet, Text, View } from 'react-native';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { WEATHERS } from '@/shared/weather';
import type { Badge } from '../api/badgeApi';

/** 메달 색은 날씨 6색을 돌려 쓴다(prototype `BADGE_TINT`). 뱃지마다 색을 정의하지 않는다 */
const TINT_ORDER = [0, 1, 5, 3, 2, 4].map((index) => WEATHERS[index]);

/**
 * 07 뱃지 그리드 3열(prototype `.badges`).
 *
 * 칸마다 카드를 두지 않는다 - 40개가 쌓이면 테두리만 보인다. 메달 동그라미와 이름·조건 글자만 둔다.
 * 잠긴 뱃지는 조건은 보이되 그림을 자물쇠로 가린다.
 */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const colors = useColors();
  const weatherColors = useWeatherColors();

  return (
    <View style={styles.grid}>
      {badges.map((badge, index) => (
        <View
          key={badge.code}
          accessible
          accessibilityLabel={`${badge.name}, ${badge.condition}, ${badge.earned ? '획득' : '잠김'}`}
          style={styles.cell}
        >
          <View
            style={[
              styles.medal,
              badge.earned ? null : { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong },
            ]}
          >
            {badge.earned ? (
              <GradientFill
                from="#ffffff"
                fromOpacity={0.9}
                to={weatherColors[TINT_ORDER[index % TINT_ORDER.length]]}
              />
            ) : (
              <Icon name="lock" size={18} color={colors.decor} />
            )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space[4] },
  cell: { flexBasis: `${100 / 3}%`, alignItems: 'center', gap: 6, paddingHorizontal: space[1] },
  medal: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: font.base, fontFamily: font.bold },
  condition: { fontSize: font.xs, fontFamily: font.regular },
});
