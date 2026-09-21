import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { MOCK_STATS } from '@/shared/lib/mockStats';
import { MOCK_VIEWER } from '@/shared/lib/mockViewer';
import { font, leading } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Screen } from '@/shared/ui/Screen';
import { ScreenTitle } from '@/shared/ui/Typo';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { SettingsList, type SettingRow } from '@/features/profile/ui/SettingsList';

/** 10 마이페이지 (시안 11:87). 07·09로 가는 입구다 */
export default function MyScreen() {
  const colors = useColors();
  const router = useRouter();

  const soon = (title: string) => () => Alert.alert(title, '이 설정 화면은 다음 라운드에 붙습니다.');

  const rows: SettingRow[] = [
    { id: 'reminder', glyph: '🔔', label: '리마인더 알림', value: '매일 오후 9시', onPress: soon('리마인더 알림') },
    { id: 'theme', glyph: '🎨', label: '테마 변경', value: 'Jelly', onPress: () => router.push('/store') },
    { id: 'art-style', glyph: '🤖', label: 'AI 그림 스타일', value: '수채화', onPress: soon('AI 그림 스타일') },
    { id: 'lock', glyph: '🔒', label: '일기 잠금', value: 'ON', onPress: soon('일기 잠금') },
    { id: 'export', glyph: '📤', label: '데이터 내보내기', value: 'CSV / PDF', onPress: soon('데이터 내보내기') },
    { id: 'account', glyph: '👤', label: '계정 · 로그아웃', onPress: soon('계정') },
    // 계정 삭제는 시안에 없지만 두 스토어 모두 필수다(docs/screen/10-mypage.md 4장)
    { id: 'delete', glyph: '🗑️', label: '계정 삭제', onPress: confirmDelete, destructive: true },
  ];

  return (
    <Screen gutter={20}>
      <ScreenTitle>MY</ScreenTitle>

      <ProfileCard
        nickname={MOCK_VIEWER.nickname}
        character={MOCK_VIEWER.character}
        joinedAt={MOCK_VIEWER.joinedAt}
        plus={MOCK_VIEWER.plus}
        stats={[
          { id: 'total', label: '총 기록', value: String(MOCK_STATS.totalDiaries) },
          { id: 'streak', label: '연속', value: `${MOCK_STATS.streakDays}일` },
          {
            id: 'badges',
            label: '뱃지',
            value: String(MOCK_STATS.badgesOwned),
            onPress: () => router.push('/badges'),
          },
        ]}
      />

      <SettingsList rows={rows} />

      <Text style={[styles.note, { color: colors.textSubtle }]}>
        로컬 우선 저장 · 서버 동기화는 연결됐을 때
      </Text>
    </Screen>
  );
}

function confirmDelete() {
  Alert.alert('계정 삭제', '기록과 그림이 모두 지워집니다. 되돌릴 수 없어요.', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: () => undefined },
  ]);
}

const styles = StyleSheet.create({
  note: { fontSize: font.xs, lineHeight: leading(font.xs), textAlign: 'center' },
});
