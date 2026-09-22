import { useRouter } from 'expo-router';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { useBadges } from '@/features/badge/hooks/useBadges';
import { BadgeGrid } from '@/features/badge/ui/BadgeGrid';

/**
 * 07 뱃지 컬렉션. 시안의 "12 / 40개"에서 40은 28개가 아직 정의되지 않아 쓸 수 없다 -
 * 서버가 지금 정의한 개수를 내려준다(07 화면 문서 7장).
 */
export default function BadgesScreen() {
  const router = useRouter();
  const badges = useBadges();

  return (
    <Screen>
      <ScreenHeader
        title="뱃지 컬렉션"
        subtitle={badges.data ? `${badges.data.earnedCount} / ${badges.data.totalCount}개 수집` : undefined}
        onBack={() => router.back()}
      />

      {badges.isError ? (
        <ErrorRetry error={badges.error} onRetry={() => badges.refetch()} />
      ) : !badges.data ? (
        <Skeleton height={110} count={4} />
      ) : (
        <BadgeGrid badges={badges.data.badges} />
      )}
    </Screen>
  );
}
