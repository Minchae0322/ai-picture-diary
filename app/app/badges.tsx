import { StyleSheet, Text, View } from 'react-native';
import { MOCK_STATS } from '@/shared/lib/mockStats';
import { font, leading, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { BackLink } from '@/shared/ui/BackLink';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Screen } from '@/shared/ui/Screen';
import { ScreenTitle } from '@/shared/ui/Typo';
import { MOCK_BADGES } from '@/features/badge/model/mockBadges';
import { BadgeGrid } from '@/features/badge/ui/BadgeGrid';

/** 07 뱃지 컬렉션 (시안 10:2). 탭이 아니라 10 마이페이지에서 밀어 올린다 */
export default function BadgesScreen() {
  const colors = useColors();
  const owned = MOCK_BADGES.filter((badge) => badge.owned).length;
  const nextBadge = MOCK_BADGES.find((badge) => !badge.owned);
  const progressLabel = `${MOCK_STATS.badgesOwned} / ${MOCK_STATS.badgesTotal}개 수집`;

  return (
    <Screen hasTabBar={false}>
      <View style={styles.header}>
        <BackLink />
        <ScreenTitle>뱃지 컬렉션</ScreenTitle>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {progressLabel}
          {nextBadge === undefined ? '' : ` · 다음 뱃지 "${nextBadge.name}"까지 ${nextBadge.condition}`}
        </Text>
      </View>

      <ProgressBar
        value={MOCK_STATS.badgesOwned / MOCK_STATS.badgesTotal}
        height={10}
        label={progressLabel}
      />

      {/* 시안에는 12종만 있다. 나머지 28종은 서버 마스터 데이터로 채운다 */}
      <BadgeGrid badges={MOCK_BADGES} />

      <Text style={[styles.note, { color: colors.textSubtle }]}>
        시안에 있는 12종만 표시합니다. 전체 {MOCK_STATS.badgesTotal}종 중 {owned}종 획득.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space[2] },
  progressText: { fontSize: font.base, fontFamily: font.regular, lineHeight: leading(font.base) },
  note: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs) },
});
