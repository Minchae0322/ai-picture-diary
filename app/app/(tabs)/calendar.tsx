import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme/tokens';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { EmptyState } from '@/shared/ui/States';
import { ScreenTitle, SectionTitle } from '@/shared/ui/Typo';
import { mockMonthEntries, mockMonthSummary } from '@/features/calendar/model/mockMonth';
import { buildMonthGrid, shiftMonth, toIsoDate } from '@/features/calendar/model/monthGrid';
import { MonthGrid } from '@/features/calendar/ui/MonthGrid';
import { MonthNav } from '@/features/calendar/ui/MonthNav';
import { MonthSummary } from '@/features/calendar/ui/MonthSummary';

/** 05 감정 캘린더 (시안 9:46). 화면은 조립만 한다(expo-app-conventions 6장) */
export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });

  const entries = useMemo(() => mockMonthEntries(cursor.year, cursor.month), [cursor]);
  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const weatherByDate = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry.weather])),
    [entries],
  );
  const summary = useMemo(() => mockMonthSummary(entries), [entries]);

  return (
    <Screen gutter={20}>
      <View style={styles.header}>
        <ScreenTitle>감정 캘린더</ScreenTitle>
        <MonthNav
          year={cursor.year}
          month={cursor.month}
          onShift={(delta) => setCursor((prev) => shiftMonth(prev.year, prev.month, delta))}
        />
      </View>

      <Card>
        <MonthGrid
          cells={cells}
          weatherByDate={weatherByDate}
          todayIso={todayIso}
          // 과거 날짜 상세 화면이 아직 없다(docs/screen/README.md 전역 미정)
          onSelect={() => undefined}
        />
      </Card>

      <Card>
        <SectionTitle>이번 달 요약</SectionTitle>
        {summary.length === 0 ? (
          <EmptyState message="이 달은 아직 기록이 없어요" />
        ) : (
          <MonthSummary items={summary} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space[2] },
});
