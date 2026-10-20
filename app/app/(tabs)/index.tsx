import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { formatFullDate } from '@/shared/format';
import { Screen } from '@/shared/ui/Screen';
import { Button } from '@/shared/ui/Button';
import { Muted } from '@/shared/ui/Type';
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

  const diary = today.data ?? null;
  const generating = diary?.status === 'GENERATING';

  /**
   * 03 오버레이를 접었는가. 접으면 딤이 걷히고 02 흐름 안에 "그리는 중" 띠만 남는다 -
   * 기다림을 강제하지 않으면서 무엇이 진행 중인지는 계속 보인다(03 화면 문서 2장).
   */
  const [minimized, setMinimized] = useState(false);

  // 다음 기록의 03 은 다시 오버레이로 시작한다. 한 번 접은 것이 영구 설정이 되면 안 된다
  useEffect(() => {
    if (!generating) {
      setMinimized(false);
    }
  }, [generating]);

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

  const newBadges = diary ? earnedOn(badges.data?.badges ?? [], diary.entryDate) : [];

  return (
    <View style={styles.root}>
      <Screen refreshing={today.isFetching && !today.isPending} onRefresh={() => today.refetch()}>
        <View style={styles.header}>
          <View style={styles.greetingColumn}>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatFullDate(new Date())}
            </Text>
            {/*
              닉네임에 띄어쓰기가 들어가면("말랑한 구름이") 그 자리에서 줄이 갈려 "님" 한 글자만
              둘째 줄에 남았다. 줄을 **우리가 먼저 나눠** 어떤 닉네임이 와도 같은 모양이 되게 한다.
              아주 긴 닉네임은 둘째 줄에서 말줄임한다 - 세 줄로 번지면 카드가 밀린다.
            */}
            <Text
              numberOfLines={2}
              style={[styles.greeting, { color: colors.text }]}
            >
              {profile.data ? `안녕하세요,\n${profile.data.nickname}님` : '안녕하세요'}
            </Text>
          </View>
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
        ) : diary.status === 'FAILED' ? (
          <FailedBlock onRetry={() => regenerate.mutate(diary.id)} pending={regenerate.isPending} />
        ) : generating ? (
          // 접었을 때만 자리를 채운다. 오버레이가 떠 있는 동안은 뒤가 비어 있어야 딤이 깔끔하다
          minimized ? <GeneratingCard content={diary.content} variant="strip" /> : null
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
          <RecentDiaries
            items={recent.data.items}
            onSelect={(id) => router.push(`/diary/${id}`)}
            onMore={() => router.push('/calendar')}
          />
        ) : null}
      </Screen>

      {/* 03 은 02 위에 덮는 딤 오버레이다(03 화면 문서 3장). 탭바는 덮지 않아 다른 탭으로 나갈 수 있다 -
          생성은 서버가 계속하고, 돌아오면 04 가 기다린다(같은 문서 2장의 "허용"). */}
      {generating && diary && !minimized ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* 딤을 눌러도 접힌다. 버튼을 찾지 않아도 빠져나갈 수 있어야 한다.
              카드를 감싸지 않고 뒤에 깔아야 카드 안의 글자와 버튼이 그대로 읽힌다 */}
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
            onPress={() => setMinimized(true)}
            accessibilityRole="button"
            accessibilityLabel="나중에 보기"
            accessibilityHint="그리는 것은 계속되고, 다 되면 홈에 나타나요"
          />
          <GeneratingCard
            content={diary.content}
            onMinimize={() => setMinimized(true)}
            onCheck={() => today.refetch()}
          />
        </View>
      ) : null}
    </View>
  );
}

function FailedBlock({ onRetry, pending }: { onRetry: () => void; pending: boolean }) {
  return (
    <View style={styles.block}>
      <Muted>오늘을 그리지 못했어요. 다시 시도해 볼까요?</Muted>
      <Button label="다시 그리기" size="medium" variant="soft" loading={pending} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  greetingColumn: { flex: 1, gap: space[1] },
  date: { fontSize: font.sm, fontFamily: font.medium },
  greeting: { fontSize: font.xxl, fontFamily: font.bold },
  block: { gap: space[3], alignItems: 'flex-start' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: space[7],
  },
});
