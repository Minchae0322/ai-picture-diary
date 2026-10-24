import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { Screen } from '@/shared/ui/Screen';
import { Button } from '@/shared/ui/Button';
import { Muted } from '@/shared/ui/Type';
import { ErrorRetry, Loading } from '@/shared/ui/StateBlock';
import { space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { earnedOn, useBadges } from '@/features/badge/hooks/useBadges';
import { useSharePost } from '@/features/community/hooks/useCommunity';
import {
  useOverview,
  useDeleteDiary,
  useRegenerateDiary,
  useToday,
  useWriteDiary,
} from '@/features/diary/hooks/useDiary';
import { DiaryComposer } from '@/features/diary/ui/DiaryComposer';
import { DRAW_STYLES, type DrawStyle, type Emotion } from '@/features/diary/api/diaryTypes';
import { DiaryResult } from '@/features/diary/ui/DiaryResult';
import { GeneratingCard } from '@/features/diary/ui/GeneratingCard';
import { HomeHeader, type HomeState } from '@/features/diary/ui/HomeHeader';
import { useProfile, useUpdateSettings } from '@/features/profile/hooks/useProfile';
import { useOnboardingDone } from '@/features/onboarding/useOnboarding';

/**
 * 홈 탭 = 화면 02 / 03 / 04.
 * 오늘 기록의 상태 하나로 갈린다. 별도 라우트로 나누지 않는다(screens/02-home.md).
 */
export default function HomeScreen() {
  const colors = useColors();
  const onboarding = useOnboardingDone();

  const today = useToday();
  const overview = useOverview();
  const badges = useBadges();
  const write = useWriteDiary();
  const regenerate = useRegenerateDiary();
  const remove = useDeleteDiary();
  /**
   * 04 에서 "다시 쓰기"로 넘어올 때 **들고 오는 것**. 지운 기록의 글·기분·그림이다.
   *
   * <p>지우는 순간 서버에는 없어지므로 앱이 들고 있어야 한다. 빈 종이로 돌려보내면
   * 방금 쓴 글을 다시 치게 된다 - 고치려고 누른 것이지 지우려고 누른 것이 아니다.
   */
  const [carried, setCarried] = useState<{
    content: string;
    emotion: Emotion | null;
    imageUrl: string | null;
  } | null>(null);
  const share = useSharePost();
  /*
    그림체는 프로필(`aiStyle`)에 산다. 화면이 들고 있으면 앱을 닫는 순간 사라지는데,
    "지난번에 고른 그림체"는 다음에 열었을 때 그대로여야 하는 값이다.
  */
  const profile = useProfile();
  const settings = useUpdateSettings();
  const style = (profile.data?.aiStyle as DrawStyle | undefined) ?? DRAW_STYLES[0].value;

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

  // 머리글이 02/03/04 중 어느 화면인지 말한다(HomeHeader 주석)
  const headerState: HomeState = generating
      ? 'generating'
      : diary === null
        ? 'empty'
        : diary.status === 'FAILED'
          ? 'failed'
          : 'done';

  return (
    <View style={styles.root}>
      {/* 02 는 "오늘 그리기"가 바닥에 붙어야 해서 하단 여백을 좁힌다(`Screen` 의 bottomSpace) */}
      <Screen
        width={headerState === 'empty' ? 'narrow' : 'wide'}
        bottomSpace={headerState === 'empty' ? 'tight' : 'default'}
        refreshing={today.isFetching && !today.isPending}
        onRefresh={() => today.refetch()}
      >
        {/*
          **02 에서는 머리글을 내린다.** 날짜와 연속 기록이 그림일기 종이 안으로 들어갔고,
          밖에 또 적으면 같은 말이 두 번 나온다. 그만큼 종이가 세로를 더 가져간다.
        */}
        {headerState === 'empty' ? null : (
          <HomeHeader state={headerState} streakDays={overview.data?.streakDays ?? 0} />
        )}

        {today.isPending ? (
          <Loading label="오늘 기록을 불러오는 중" />
        ) : today.isError ? (
          // 조회가 실패해도 입력은 살려 둔다 - 카드 자리만 재시도로 바꾼다(02 화면 문서 5장)
          <ErrorRetry error={today.error} onRetry={() => today.refetch()} />
        ) : diary === null ? (
          <DiaryComposer
            submitting={write.isPending}
            errorMessage={write.error instanceof ApiError ? write.error.message : undefined}
            style={style}
            onStyleChange={(next) => settings.mutate({ aiStyle: next })}
            carried={carried}
            onSubmit={(content, userHint) =>
              // 새로 쓰고 나면 들고 온 것은 역할이 끝난다 - 남겨 두면 다음 날 종이에 되살아난다
              write.mutate({ content, userHint }, { onSuccess: () => setCarried(null) })
            }
          />
        ) : diary.status === 'FAILED' ? (
          <FailedBlock onRetry={() => regenerate.mutate(diary.id)} pending={regenerate.isPending} />
        ) : generating ? (
          // 접었을 때만 자리를 채운다. 오버레이가 떠 있는 동안은 뒤가 비어 있어야 딤이 깔끔하다
          minimized ? <GeneratingCard content={diary.content} variant="strip" /> : null
        ) : (
          <DiaryResult
            diary={diary}
            regenerating={remove.isPending}
            onRegenerate={() => {
              setCarried({
                content: diary.content,
                emotion: diary.emotion,
                imageUrl: diary.imageUrl,
              });
              remove.mutate(diary.id);
            }}
            onShare={() => share.mutate(diary.id)}
            sharing={share.isPending}
            shared={share.isSuccess}
            shareError={share.error instanceof ApiError ? share.error.message : undefined}
            earnedBadges={newBadges}
          />
        )}

        {/*
          최근 기록은 **홈에서 뺐다**(2026-10-24). 홈이 하는 일은 하나다 - 오늘 한 편을 쓰고
          나온 그림을 보는 것. 지난 기록을 보는 일은 05 캘린더가 이미 그 일만 하는 탭으로 있는데,
          홈 밑에 세 건을 더 깔면 "쓰는 화면"과 "보는 화면"이 한 데 섞인다.
          이 자리를 비워야 쓰는 자리가 접힌 선 위로 올라온다.
        */}
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
      {/* "오늘을 그리지 못했어요"는 머리글이 이미 말한다. 여기서는 다음 행동만 */}
      <Muted>한 번 더 그려 볼까요? 쓴 글은 그대로 있어요.</Muted>
      <Button label="다시 그리기" size="medium" variant="soft" loading={pending} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
