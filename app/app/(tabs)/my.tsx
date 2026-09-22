import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { formatReminder } from '@/shared/format';
import { Card } from '@/shared/ui/Card';
import { ListRow } from '@/shared/ui/ListRow';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { useBadges } from '@/features/badge/hooks/useBadges';
import { useOverview } from '@/features/diary/hooks/useDiary';
import { useProfile, useUpdateSettings } from '@/features/profile/hooks/useProfile';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';

/** 10 마이페이지. 통계 3종은 서버 집계를 그대로 쓴다 - 연속 일수는 02·06과 같은 값이다. */
export default function MyScreen() {
  const colors = useColors();
  const router = useRouter();
  const profile = useProfile();
  const overview = useOverview();
  const badges = useBadges();
  const updateSettings = useUpdateSettings();

  return (
    <Screen>
      <ScreenHeader title="MY" />

      {profile.isError ? (
        <ErrorRetry error={profile.error} onRetry={() => profile.refetch()} />
      ) : !profile.data ? (
        <Skeleton height={180} />
      ) : (
        <ProfileCard
          profile={profile.data}
          stats={{
            totalCount: overview.data?.totalCount ?? null,
            streakDays: overview.data?.streakDays ?? null,
            badgeCount: badges.data?.earnedCount ?? null,
          }}
        />
      )}

      <Card>
        <ListRow
          icon="bell"
          label="리마인더 알림"
          value={formatReminder(profile.data?.reminderTime ?? null)}
          onPress={() => notReady('리마인더 설정')}
        />
        <ListRow
          icon="palette"
          label="테마 변경"
          value={profile.data?.themeName}
          onPress={() => router.push('/store')}
        />
        <ListRow
          icon="sparkle"
          label="AI 그림 스타일"
          value={profile.data?.aiStyle}
          onPress={() => notReady('그림 스타일 설정')}
        />
        <ListRow
          icon="lock"
          label="일기 잠금"
          value={profile.data?.diaryLock ? 'ON' : 'OFF'}
          onPress={() => updateSettings.mutate({ diaryLock: !profile.data?.diaryLock })}
        />
        <ListRow
          icon="download"
          label="데이터 내보내기"
          value="CSV / PDF"
          onPress={() => notReady('데이터 내보내기')}
        />
        <ListRow icon="account" label="계정 · 로그아웃" value="" onPress={() => notReady('계정 설정')} />
        <ListRow icon="medal" label="뱃지" value={badgeValue(badges.data)} onPress={() => router.push('/badges')} />
      </Card>

      <Text style={[styles.note, { color: colors.textSubtle }]}>
        로컬 우선 저장 · 서버 동기화는 순차 적용 중이에요
      </Text>
    </Screen>
  );
}

function badgeValue(data?: { earnedCount: number; totalCount: number }): string {
  return data ? `${data.earnedCount} / ${data.totalCount}` : '-';
}

/**
 * 설정 하위 화면 6종은 시안에 없다(10 화면 문서 7장). 동작하는 척하지 않고 준비 중임을 알린다 -
 * 계정 삭제는 인증(spring-auth)이 붙어야 의미가 생겨 여기 포함되지 않았다.
 */
function notReady(name: string) {
  Alert.alert(name, '아직 준비 중이에요.');
}

const styles = StyleSheet.create({
  note: { fontSize: font.xs, textAlign: 'center', paddingHorizontal: space[4] },
});
