import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { Icon } from '@/shared/ui/Icon';
import { formatDotDate } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Profile } from '../api/profileApi';

type Props = {
  profile: Profile;
  /** 서버 집계. 조회 실패 시 null 이면 "-" 로 보여주고 통계 영역만 재시도한다(10 화면 문서 5장). */
  stats: { totalCount: number | null; streakDays: number | null; badgeCount: number | null };
};

/** 10 프로필 카드 + 통계 3개. 기록 0건이어도 0으로 표시한다 - 숨기지 않는다. */
export function ProfileCard({ profile, stats }: Props) {
  const colors = useColors();
  const items = [
    { label: '총 기록', value: stats.totalCount, suffix: '' },
    { label: '연속', value: stats.streakDays, suffix: '일' },
    { label: '뱃지', value: stats.badgeCount, suffix: '' },
  ];

  return (
    <Card>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Icon name="bear" size={30} color={colors.primaryFg} />
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>{profile.nickname}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {profile.characterName} · {formatDotDate(profile.joinedOn)} 가입
          </Text>
        </View>
        {profile.plus ? (
          <View accessible accessibilityLabel="Jelly Plus 구독 중" style={[styles.plus, { backgroundColor: colors.primary }]}>
            <Icon name="crown" size={12} color={colors.primaryFg} />
            <Text style={[styles.plusText, { color: colors.primaryFg }]}>Jelly Plus</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.stats}>
        {items.map((item) => (
          <View
            key={item.label}
            accessible
            accessibilityLabel={`${item.label} ${item.value ?? '없음'}`}
            style={styles.stat}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>
              {item.value === null ? '-' : `${item.value}${item.suffix}`}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: 2 },
  name: { fontSize: font.lg, fontWeight: font.weightBold },
  meta: { fontSize: font.xs },
  plus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.full,
  },
  plusText: { fontSize: font.xs },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: font.lg, fontWeight: font.weightBold },
  statLabel: { fontSize: font.xs },
});
