import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MOCK_STATS } from '@/shared/lib/mockStats';
import { font, leading, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { formatMood } from '@/shared/weather';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Screen } from '@/shared/ui/Screen';
import { Segmented } from '@/shared/ui/Segmented';
import { ScreenTitle, SectionTitle } from '@/shared/ui/Typo';
import { MOCK_WORDS, mockTrend } from '@/features/graph/model/mockTrend';
import { RANGE_OPTIONS, summarize, type TrendRange } from '@/features/graph/model/trend';
import { KpiRow } from '@/features/graph/ui/KpiRow';
import { MoodTrendChart } from '@/features/graph/ui/MoodTrendChart';

const RANGE_TITLE: Record<TrendRange, string> = {
  week: '이번 주 기분 추이',
  month: '이번 달 기분 추이',
  year: '올해 기분 추이',
};

/** 06 감정 그래프 (시안 9:181) */
export default function GraphScreen() {
  const colors = useColors();
  const [range, setRange] = useState<TrendRange>('month');

  const points = useMemo(() => mockTrend(range), [range]);
  const stats = useMemo(() => summarize(points), [points]);

  return (
    <Screen gutter={20}>
      <View style={styles.header}>
        <ScreenTitle>감정 그래프</ScreenTitle>
        {/* 세그먼트를 바꾸면 차트·부제·KPI·자주 쓴 말이 모두 이 기간으로 바뀐다 */}
        <Segmented
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          accessibilityLabel="기간 선택"
        />
      </View>

      <Card>
        <SectionTitle>{RANGE_TITLE[range]}</SectionTitle>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {stats.average === null
            ? '아직 기록이 없어요'
            : `평균 ${formatMood(stats.average)} · 기록 ${stats.recorded}일`}
        </Text>
        <MoodTrendChart points={points} stats={stats} />
      </Card>

      <KpiRow
        items={[
          {
            label: '평균 기분',
            value: stats.average === null ? '-' : formatMood(stats.average),
            tint: weatherColor.SUNNY,
          },
          {
            label: '최고의 날',
            value: stats.best === null ? '-' : stats.best.label,
            tint: weatherColor.RAINBOW,
          },
          { label: '연속 기록', value: `${MOCK_STATS.streakDays}일`, tint: weatherColor.RAIN },
        ]}
      />

      <Card>
        <SectionTitle>자주 쓴 말</SectionTitle>
        <View style={styles.words}>
          {MOCK_WORDS.map((word) => (
            // 탭 동작은 미정이다(docs/screen/06-graph.md 7장). 지금은 읽기 전용
            <Chip key={word} label={word} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space[4] },
  subtitle: { fontSize: font.sm, lineHeight: leading(font.sm), marginTop: -space[2] },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
