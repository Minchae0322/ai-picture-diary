import { StyleSheet, Text, View } from 'react-native';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon } from '@/shared/ui/Icon';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { font, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors, useEmotionColors } from '@/shared/theme/useColors';
import { EMOTIONS } from '@/shared/emotion';
import type { Badge } from '../api/badgeApi';

/**
 * 메달 색은 감정 9색을 돌려 쓴다(prototype `BADGE_TINT`). 뱃지마다 색을 정의하지 않는다.
 * 이웃한 칸끼리 같은 계열(빨강 셋)이 붙지 않도록 순서를 섞어 둔다 - 여기서 색은 장식일 뿐이다.
 */
const TINT_ORDER = [0, 5, 7, 4, 1, 6, 8, 3, 2].map((index) => EMOTIONS[index]);

/**
 * 07 뱃지 그리드 3열(prototype `.badges`).
 *
 * 칸마다 카드를 두지 않는다 - 40개가 쌓이면 테두리만 보인다. 메달 동그라미와 이름·조건 글자만 둔다.
 * 잠긴 뱃지는 조건은 보이되 그림을 자물쇠로 가린다.
 *
 * <p>**잠긴 칸을 점선으로 그리지 않는다.** 12개 중 11개가 잠긴 초기 화면에서 점선 원이 줄지어 서면
 * 화면 전체가 그물처럼 보이고, 정작 하나뿐인 획득 뱃지가 묻힌다. 잠긴 칸은 연한 면으로 가라앉히고
 * (글자까지 같이) 획득한 칸만 그림자로 띄운다 - 눈이 먼저 닿아야 하는 쪽은 딴 것이다.
 *
 * <p>감정 캐릭터 그림은 여기 쓰지 않는다. 뱃지는 감정이 아니라서 과일 얼굴을 올리면
 * "이 뱃지 = 이 감정"으로 읽힌다(프로젝트 스킬 3장).
 */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const colors = useColors();
  const emotionColors = useEmotionColors();

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
              badge.earned ? shadow.sm : { backgroundColor: colors.skeleton },
            ]}
          >
            {/* 메달 테두리도 손으로. 잠긴 칸은 연한 선, 획득한 칸은 또렷한 선 */}
            <SketchBorder
              radius={23}
              color={badge.earned ? colors.borderStrong : colors.border}
              strokeWidth={1.5}
              wobble={0.9}
              seed={index * 17 + 5}
            />
            {badge.earned ? (
              <GradientFill
                from="#ffffff"
                fromOpacity={0.9}
                to={emotionColors[TINT_ORDER[index % TINT_ORDER.length]]}
              />
            ) : (
              <Icon name="lock" size={18} color={colors.decor} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.name, { color: badge.earned ? colors.text : colors.textMuted }]}
          >
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
