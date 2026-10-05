import { useRouter } from 'expo-router';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Note } from '@/shared/ui/Type';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { useBadges } from '@/features/badge/hooks/useBadges';
import type { BadgeCollection } from '@/features/badge/api/badgeApi';
import { BadgeGrid } from '@/features/badge/ui/BadgeGrid';

/**
 * 07 뱃지 컬렉션. 시안의 "12 / 40개"에서 40은 28개가 아직 정의되지 않아 쓸 수 없다 -
 * 서버가 지금 정의한 개수를 내려준다(07 화면 문서 7장).
 */
export default function BadgesScreen() {
  const router = useRouter();
  const badges = useBadges();
  const data = badges.data;

  return (
    <Screen>
      <ScreenHeader
        title="뱃지 컬렉션"
        subtitle={data ? subtitle(data) : undefined}
        onBack={() => router.back()}
      />

      {badges.isError ? (
        <ErrorRetry error={badges.error} onRetry={() => badges.refetch()} />
      ) : !data ? (
        <Skeleton height={110} count={4} />
      ) : (
        <>
          <ProgressBar
            value={data.totalCount === 0 ? 0 : data.earnedCount / data.totalCount}
            height={10}
            accessibilityLabel={`${data.earnedCount} / ${data.totalCount}개 수집`}
          />
          <BadgeGrid badges={data.badges} />
          <Note>메달 색은 날씨 6색을 돌려 씁니다. 뱃지마다의 그림은 아직 없어요.</Note>
        </>
      )}
    </Screen>
  );
}

/** prototype 은 수집률 옆에 "다음 뱃지까지"를 함께 적는다. 다음 뱃지는 잠긴 것 중 첫 번째다 */
function subtitle(data: BadgeCollection): string {
  const next = data.badges.find((badge) => !badge.earned);
  const collected = `${data.earnedCount} / ${data.totalCount}개 수집`;
  return next ? `${collected} · 다음 뱃지 “${next.name}”까지 ${next.condition}` : collected;
}
