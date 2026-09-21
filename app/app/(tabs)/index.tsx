import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from '@/shared/ui/Button';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import {
  useRecentDiaries,
  useRegenerateDiary,
  useToday,
  useWriteDiary,
} from '@/features/diary/hooks/useDiary';
import { DiaryComposer } from '@/features/diary/ui/DiaryComposer';
import { DiaryResult } from '@/features/diary/ui/DiaryResult';
import { GeneratingCard } from '@/features/diary/ui/GeneratingCard';
import { RecentDiaries } from '@/features/diary/ui/RecentDiaries';

/**
 * 홈 탭 = 화면 02 / 03 / 04.
 * 오늘 기록의 상태 하나로 갈린다. 별도 라우트로 나누지 않는다(screens/02-home.md).
 */
export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const recent = useRecentDiaries(3);
  const write = useWriteDiary();
  const regenerate = useRegenerateDiary();

  const diary = today.data ?? null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[8] },
      ]}
      refreshControl={
        <RefreshControl refreshing={today.isFetching && !today.isPending} onRefresh={() => today.refetch()} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.date, { color: colors.textMuted }]}>{formatToday()}</Text>
        <Text style={[styles.greeting, { color: colors.text }]}>안녕하세요 🍬</Text>
      </View>

      {today.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : today.isError ? (
        <ErrorBlock error={today.error} onRetry={() => today.refetch()} />
      ) : diary === null ? (
        <DiaryComposer
          submitting={write.isPending}
          errorMessage={write.error instanceof ApiError ? write.error.message : undefined}
          onSubmit={(content, userHint) => write.mutate({ content, userHint })}
        />
      ) : diary.status === 'GENERATING' ? (
        <GeneratingCard content={diary.content} />
      ) : diary.status === 'FAILED' ? (
        <FailedBlock onRetry={() => regenerate.mutate(diary.id)} pending={regenerate.isPending} />
      ) : (
        <DiaryResult
          diary={diary}
          regenerating={regenerate.isPending}
          onRegenerate={() => regenerate.mutate(diary.id)}
        />
      )}

      {recent.data ? <RecentDiaries items={recent.data.items} /> : null}
    </ScrollView>
  );
}

function ErrorBlock({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const colors = useColors();
  const message = error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.';
  return (
    <View style={styles.block}>
      <Text style={{ color: colors.textMuted, fontSize: font.sm }}>{message}</Text>
      <Button label="다시 시도" size="medium" variant="ghost" onPress={onRetry} />
    </View>
  );
}

function FailedBlock({ onRetry, pending }: { onRetry: () => void; pending: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.block}>
      <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
        오늘을 그리지 못했어요. 다시 시도해 볼까요?
      </Text>
      <Button label="다시 그리기" size="medium" loading={pending} onPress={onRetry} />
    </View>
  );
}

function formatToday(): string {
  const now = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${week}요일`;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], gap: space[6] },
  header: { gap: space[1] },
  date: { fontSize: font.xs },
  greeting: { fontSize: font.xl, fontWeight: font.weightBold },
  block: { gap: space[3] },
});
