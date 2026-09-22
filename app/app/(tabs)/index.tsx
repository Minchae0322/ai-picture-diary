import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { formatFullDate } from '@/shared/format';
import { Screen } from '@/shared/ui/Screen';
import { Button } from '@/shared/ui/Button';
import { ErrorRetry, Loading } from '@/shared/ui/StateBlock';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { earnedOn, useBadges } from '@/features/badge/hooks/useBadges';
import { useSharePost } from '@/features/community/hooks/useCommunity';
import {
  useOverview,
  useRecentDiaries,
  useRegenerateDiary,
  useToday,
  useWriteDiary,
} from '@/features/diary/hooks/useDiary';
import { DiaryComposer } from '@/features/diary/ui/DiaryComposer';
import { DiaryResult } from '@/features/diary/ui/DiaryResult';
import { GeneratingCard } from '@/features/diary/ui/GeneratingCard';
import { RecentDiaries } from '@/features/diary/ui/RecentDiaries';
import { StreakBadge } from '@/features/diary/ui/StreakBadge';
import { useOnboardingDone } from '@/features/onboarding/useOnboarding';
import { useProfile } from '@/features/profile/hooks/useProfile';

/**
 * 홈 탭 = 화면 02 / 03 / 04.
 * 오늘 기록의 상태 하나로 갈린다. 별도 라우트로 나누지 않는다(screens/02-home.md).
 */
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const onboarding = useOnboardingDone();

  const today = useToday();
  const recent = useRecentDiaries(3);
  const overview = useOverview();
  const profile = useProfile();
  const badges = useBadges();
  const write = useWriteDiary();
  const regenerate = useRegenerateDiary();
  const share = useSharePost();

  // 온보딩 여부를 알기 전에 홈을 그리면 온보딩이 깜빡였다 사라진다
  if (onboarding === 'unknown') {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }
  if (onboarding === 'pending') {
    return <Redirect href="/onboarding" />;
  }

  const diary = today.data ?? null;
  const newBadges = diary ? earnedOn(badges.data?.badges ?? [], diary.entryDate) : [];

  return (
    <Screen refreshing={today.isFetching && !today.isPending} onRefresh={() => today.refetch()}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: colors.textMuted }]}>{formatFullDate(new Date())}</Text>
        <Text style={[styles.greeting, { color: colors.text }]}>
          안녕하세요{profile.data ? `, ${profile.data.nickname}님` : ''}
        </Text>
        <StreakBadge days={overview.data?.streakDays ?? 0} />
      </View>

      {today.isPending ? (
        <Loading label="오늘 기록을 불러오는 중" />
      ) : today.isError ? (
        // 조회가 실패해도 입력은 살려 둔다 - 카드 자리만 재시도로 바꾼다(02 화면 문서 5장)
        <ErrorRetry error={today.error} onRetry={() => today.refetch()} />
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
          onShare={() => share.mutate(diary.id)}
          sharing={share.isPending}
          shared={share.isSuccess}
          shareError={share.error instanceof ApiError ? share.error.message : undefined}
          earnedBadges={newBadges}
        />
      )}

      {recent.data ? (
        <RecentDiaries items={recent.data.items} onSelect={(id) => router.push(`/diary/${id}`)} />
      ) : null}
    </Screen>
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

const styles = StyleSheet.create({
  header: { gap: space[2] },
  date: { fontSize: font.xs },
  greeting: { fontSize: font.xl, fontWeight: font.weightBold },
  block: { gap: space[3], alignItems: 'flex-start' },
});
