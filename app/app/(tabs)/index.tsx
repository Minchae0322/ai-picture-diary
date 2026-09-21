import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { MOCK_STATS } from '@/shared/lib/mockStats';
import { MOCK_VIEWER } from '@/shared/lib/mockViewer';
import { font, leading, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { ErrorState, Skeleton } from '@/shared/ui/States';
import {
  useRecentDiaries,
  useRegenerateDiary,
  useToday,
  useWriteDiary,
} from '@/features/diary/hooks/useDiary';
import { formatLongDate } from '@/features/diary/model/format';
import { DiaryComposer } from '@/features/diary/ui/DiaryComposer';
import { DiaryResult } from '@/features/diary/ui/DiaryResult';
import { GeneratingOverlay } from '@/features/diary/ui/GeneratingOverlay';
import { RecentDiaries } from '@/features/diary/ui/RecentDiaries';
import { StreakChip } from '@/features/diary/ui/StreakChip';

/**
 * 홈 탭 = 화면 02 / 03 / 04 (시안 8:28 · 8:91 · 9:2).
 * 오늘 기록의 상태 하나로 갈린다. 별도 라우트로 나누지 않는다(screens/02-home.md).
 */
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const today = useToday();
  const recent = useRecentDiaries(3);
  const write = useWriteDiary();
  const regenerate = useRegenerateDiary();

  const diary = today.data ?? null;
  const generating = diary?.status === 'GENERATING';

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={today.isFetching && !today.isPending}
            onRefresh={() => void today.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.date, { color: colors.textMuted }]}>{formatLongDate(new Date())}</Text>
            <Text accessibilityRole="header" style={[styles.greeting, { color: colors.text }]}>
              안녕하세요, {MOCK_VIEWER.nickname}님 🍬
            </Text>
          </View>
          <StreakChip days={MOCK_STATS.streakDays} />
        </View>

        {today.isPending ? (
          <View style={styles.skeleton}>
            <Skeleton height={321} />
            <Skeleton height={35} width="60%" />
          </View>
        ) : today.isError ? (
          <ErrorState error={today.error} onRetry={() => void today.refetch()} />
        ) : diary === null || generating ? (
          <DiaryComposer
            submitting={write.isPending || generating}
            errorMessage={write.error instanceof ApiError ? write.error.message : undefined}
            onSubmit={(content, userHint) => write.mutate({ content, userHint })}
          />
        ) : diary.status === 'FAILED' ? (
          <FailedCard onRetry={() => regenerate.mutate(diary.id)} pending={regenerate.isPending} />
        ) : (
          <DiaryResult
            diary={diary}
            regenerating={regenerate.isPending}
            onRegenerate={() => regenerate.mutate(diary.id)}
            onShare={() => router.push('/community')}
            earnedBadge={
              MOCK_STATS.streakDays === 14 ? `${MOCK_STATS.streakDays}일 연속 달성! “젤리 14”` : undefined
            }
          />
        )}

        {recent.data === undefined ? null : <RecentDiaries items={recent.data.items} />}
      </Screen>

      {/* 03은 02 위를 덮는 오버레이다(docs/screen/03-generating.md 3장) */}
      {generating && diary !== null ? <GeneratingOverlay content={diary.content} /> : null}
    </>
  );
}

/** 감정 분석까지 실패한 경우. 이미지만 실패하면 DONE이라 여기로 오지 않는다 */
function FailedCard({ onRetry, pending }: { onRetry: () => void; pending: boolean }) {
  const colors = useColors();
  return (
    <Card>
      <Text style={[styles.failedTitle, { color: colors.text }]}>오늘을 그리지 못했어요</Text>
      <Text style={[styles.failedBody, { color: colors.textMuted }]}>
        다시 시도해 볼까요? 쓰신 한 줄은 그대로 있어요.
      </Text>
      <Button label="다시 그리기" size="medium" loading={pending} onPress={onRetry} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  headerText: { flex: 1, gap: space[1] },
  date: { fontSize: font.sm, lineHeight: leading(font.sm), fontWeight: font.weightMedium },
  greeting: { fontSize: font.xxl, lineHeight: leading(font.xxl, 1.35), fontWeight: font.weightBold },
  skeleton: { gap: space[6] },
  failedTitle: { fontSize: font.lg, lineHeight: leading(font.lg), fontWeight: font.weightBold },
  failedBody: { fontSize: font.sm, lineHeight: leading(font.sm) },
});
