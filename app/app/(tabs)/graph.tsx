import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatAverage, formatScore, formatShortDate } from '@/shared/format';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Empty, ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { Segmented } from '@/shared/ui/Segmented';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { useStats } from '@/features/diary/hooks/useDiary';
import type { DiaryStats, StatsPeriod } from '@/features/diary/api/diaryTypes';
import { KpiRow } from '@/features/diary/ui/KpiRow';
import { MoodChart, MoodChartSummary } from '@/features/diary/ui/MoodChart';

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'WEEK', label: '주' },
  { value: 'MONTH', label: '월' },
  { value: 'YEAR', label: '년' },
];

/** 06 감정 그래프. 기간을 바꾸면 차트·부제·KPI·자주 쓴 말이 전부 그 기간으로 바뀐다. */
export default function GraphScreen() {
  const [period, setPeriod] = useState<StatsPeriod>('MONTH');
  const stats = useStats(period);

  return (
    <Screen>
      <ScreenHeader title="감정 그래프" />

      <Segmented
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        accessibilityLabel="기간 선택"
      />

      {stats.isError ? (
        <ErrorRetry error={stats.error} onRetry={() => stats.refetch()} />
      ) : !stats.data ? (
        <Skeleton height={200} count={2} />
      ) : (
        <StatsBody stats={stats.data} periodLabel={labelOf(period)} />
      )}
    </Screen>
  );
}

function StatsBody({ stats, periodLabel }: { stats: DiaryStats; periodLabel: string }) {
  const colors = useColors();
  // 점이 2개 미만이면 추이선이 뜻을 갖지 못한다(06 화면 문서 5장)
  const drawable = stats.points.length >= 2;

  return (
    <>
      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{periodLabel} 기분 추이</Text>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>{subtitle(stats)}</Text>

        {drawable ? (
          <>
            <MoodChart points={stats.points} from={stats.from} to={stats.to} />
            <MoodChartSummary points={stats.points} />
          </>
        ) : (
          <Empty message="기록이 3일 이상 쌓이면 추이를 보여드려요" />
        )}
      </Card>

      <KpiRow
        items={[
          { label: '평균 기분', value: formatAverage(stats.average) },
          {
            label: '최고의 날',
            value: stats.bestDate ? formatShortDate(stats.bestDate) : '-',
          },
          { label: '연속 기록', value: `${stats.streakDays}일` },
        ]}
      />

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{periodLabel} 자주 쓴 말</Text>
        {stats.words.length === 0 ? (
          <Empty message="아직 모을 말이 부족해요" />
        ) : (
          <View style={styles.words}>
            {stats.words.map((word) => (
              <Chip key={word.word} label={`${word.word} ${word.count}`} />
            ))}
          </View>
        )}
      </Card>
    </>
  );
}

/** 지난 기간과의 차이는 두 값이 다 있을 때만 말한다 - 없는 값을 0으로 채우지 않는다. */
function subtitle(stats: DiaryStats): string {
  if (stats.average === null) {
    return '아직 기록이 없어요';
  }
  const average = `평균 ${formatAverage(stats.average)}`;
  if (stats.previousAverage === null) {
    return `${average} · 비교할 지난 기간이 없어요`;
  }
  const diff = Math.round((stats.average - stats.previousAverage) * 10) / 10;
  if (diff === 0) {
    return `${average} · 지난 기간과 같아요`;
  }
  return `${average} · 지난 기간보다 ${formatScore(diff)}`;
}

function labelOf(period: StatsPeriod): string {
  return { WEEK: '이번 주', MONTH: '이번 달', YEAR: '올해' }[period];
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: font.base, fontWeight: font.weightBold },
  cardSub: { fontSize: font.xs },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
