import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatMonth } from '@/shared/format';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Empty, ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { useCalendar } from '@/features/diary/hooks/useDiary';
import { CalendarMonth } from '@/features/diary/ui/CalendarMonth';
import { MonthSummary } from '@/features/diary/ui/MonthSummary';

/** 05 감정 캘린더. 날짜를 누르면 04 결과(과거 날짜)로 간다. */
export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const calendar = useCalendar(month);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <ScreenHeader title="감정 캘린더" />

      <View style={styles.monthRow}>
        <MonthButton label="‹" hint="이전 달" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text style={[styles.month, { color: colors.text }]}>{formatMonth(month)}</Text>
        <MonthButton label="›" hint="다음 달" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>

      {calendar.isError ? (
        <ErrorRetry error={calendar.error} onRetry={() => calendar.refetch()} />
      ) : !calendar.data ? (
        <Skeleton height={320} />
      ) : (
        <>
          <Card>
            <CalendarMonth
              month={calendar.data.month}
              days={calendar.data.days}
              today={today}
              onSelect={(diaryId) => router.push(`/diary/${diaryId}`)}
            />
          </Card>

          <Card>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>이번 달 요약</Text>
            {calendar.data.recordedDays === 0 ? (
              <Empty message="이 달은 아직 기록이 없어요" />
            ) : (
              <MonthSummary summary={calendar.data.summary} />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function MonthButton({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint}
      style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Text style={{ color: colors.text, fontSize: font.lg }}>{label}</Text>
    </Pressable>
  );
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** 미래 달로도 넘어갈 수 있다. 데이터가 없을 뿐이며 그건 빈 상태가 처리한다(05 화면 문서 4장). */
function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(year, monthNumber - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[4] },
  monthButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { fontSize: font.base, fontWeight: font.weightBold },
  summaryTitle: { fontSize: font.sm, fontWeight: font.weightBold },
});
