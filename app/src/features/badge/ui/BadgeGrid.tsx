import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Badge } from '../model/mockBadges';

/** 획득 뱃지의 원에 쓰는 색. 순서 고정이라 목록이 바뀌어도 같은 뱃지는 같은 색이다 */
const OWNED_TINTS = [
  weatherColor.SUNNY,
  weatherColor.PARTLY_CLOUDY,
  weatherColor.RAINBOW,
  weatherColor.RAIN,
  weatherColor.CLOUDY,
  weatherColor.SNOW,
];

/**
 * 시안 07 `badge-grid`. 3열.
 * 잠금 뱃지는 조건은 보이되 아이콘을 가린다(docs/screen/07-badge.md 4장).
 */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {badges.map((badge, index) => (
        <View
          key={badge.id}
          accessible
          accessibilityLabel={
            badge.owned
              ? `${badge.name}, 획득함, 조건 ${badge.condition}`
              : `${badge.name}, 잠김, 조건 ${badge.condition}`
          }
          style={styles.item}
        >
          {badge.owned ? (
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', OWNED_TINTS[index % OWNED_TINTS.length]] as const}
              style={styles.medal}
            />
          ) : (
            <View style={[styles.medal, styles.locked, { borderColor: colors.borderStrong }]}>
              <Text style={styles.lockGlyph} accessibilityElementsHidden importantForAccessibility="no">
                🔒
              </Text>
            </View>
          )}
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
  item: { width: `${100 / 3}%`, alignItems: 'center', gap: 6, paddingHorizontal: space[1] },
  medal: { width: 46, height: 46, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  locked: { borderWidth: 1.5, borderStyle: 'dashed' },
  lockGlyph: { fontSize: 16, lineHeight: 20 },
  name: { fontSize: font.base, lineHeight: leading(font.base, 1.1), fontWeight: font.weightBold },
  condition: { fontSize: font.xs, lineHeight: leading(font.xs, 1.1) },
});
