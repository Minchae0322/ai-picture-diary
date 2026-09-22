import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDotDate } from '@/shared/format';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ErrorRetry, Loading } from '@/shared/ui/StateBlock';
import { useDiaryDetail, useRegenerateDiary } from '@/features/diary/hooks/useDiary';
import { DiaryResult } from '@/features/diary/ui/DiaryResult';
import { GeneratingCard } from '@/features/diary/ui/GeneratingCard';

/**
 * 04 결과 - 과거 날짜 모드. 05 캘린더와 02 최근 기록에서 들어온다.
 * 오늘 화면과 같은 레이아웃을 쓰되 공유 버튼은 주지 않는다(공유는 오늘 기록의 동선이다).
 */
export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const diary = useDiaryDetail(id);
  const regenerate = useRegenerateDiary();

  return (
    <Screen>
      <ScreenHeader
        title={diary.data ? formatDotDate(diary.data.entryDate) : '기록'}
        onBack={() => router.back()}
      />

      {diary.isPending ? (
        <Loading label="기록을 불러오는 중" />
      ) : diary.isError ? (
        <ErrorRetry error={diary.error} onRetry={() => diary.refetch()} />
      ) : diary.data.status === 'GENERATING' ? (
        <GeneratingCard content={diary.data.content} />
      ) : (
        <DiaryResult
          diary={diary.data}
          regenerating={regenerate.isPending}
          onRegenerate={() => regenerate.mutate(diary.data.id)}
        />
      )}
    </Screen>
  );
}
