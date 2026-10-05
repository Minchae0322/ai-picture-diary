import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatReminder } from '@/shared/format';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { SettingsList, type SettingsRow } from '@/shared/ui/SettingsList';
import { Note } from '@/shared/ui/Type';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { useToast } from '@/shared/ui/Toast';
import { StyleSheet } from 'react-native';
import { useBadges } from '@/features/badge/hooks/useBadges';
import { useOverview } from '@/features/diary/hooks/useDiary';
import { useProfile, useUpdateSettings } from '@/features/profile/hooks/useProfile';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';

/** 10 마이페이지. 통계 3종은 서버 집계를 그대로 쓴다 - 연속 일수는 02·06과 같은 값이다. */
export default function MyScreen() {
  const router = useRouter();
  const toast = useToast();
  const profile = useProfile();
  const overview = useOverview();
  const badges = useBadges();
  const updateSettings = useUpdateSettings();

  /**
   * 설정 하위 화면 6종은 시안에 없다(10 화면 문서 7장). 동작하는 척하지 않고 준비 중임을 알린다 -
   * 계정 삭제는 인증(spring-auth)이 붙어야 의미가 생겨 여기 포함되지 않았다.
   */
  const notReady = (name: string) => toast(`${name} 화면은 다음 라운드에 붙습니다`);

  const rows: SettingsRow[] = [
    {
      icon: 'bell',
      label: '리마인더 알림',
      value: formatReminder(profile.data?.reminderTime ?? null),
      onPress: () => notReady('리마인더 설정'),
    },
    {
      icon: 'palette',
      label: '테마 변경',
      value: profile.data?.themeName,
      onPress: () => router.push('/store'),
    },
    {
      icon: 'sparkle',
      label: 'AI 그림 스타일',
      value: profile.data?.aiStyle,
      onPress: () => notReady('그림 스타일 설정'),
    },
    {
      icon: 'lock',
      label: '일기 잠금',
      value: profile.data?.diaryLock ? 'ON' : 'OFF',
      onPress: () => updateSettings.mutate({ diaryLock: !profile.data?.diaryLock }),
    },
    {
      icon: 'download',
      label: '데이터 내보내기',
      value: 'CSV / PDF',
      onPress: () => notReady('데이터 내보내기'),
    },
    { icon: 'account', label: '계정 · 로그아웃', value: '', onPress: () => notReady('계정 설정') },
    {
      icon: 'medal',
      label: '뱃지',
      value: badgeValue(badges.data),
      onPress: () => router.push('/badges'),
    },
  ];

  return (
    <Screen width="narrow">
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
          onOpenBadges={() => router.push('/badges')}
        />
      )}

      <SettingsList rows={rows} />

      <View style={styles.footer}>
        <Note style={styles.center}>로컬 우선 저장 · 서버 동기화는 순차 적용 중이에요</Note>
      </View>
    </Screen>
  );
}

function badgeValue(data?: { earnedCount: number; totalCount: number }): string {
  return data ? `${data.earnedCount} / ${data.totalCount}` : '-';
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
