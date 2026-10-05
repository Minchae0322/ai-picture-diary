import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { GradientFill } from '@/shared/ui/Gradient';
import { formatDotDate } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import type { Profile } from '../api/profileApi';

type Props = {
  profile: Profile;
  /** 서버 집계. 조회 실패 시 null 이면 "-" 로 보여주고 통계 영역만 재시도한다(10 화면 문서 5장). */
  stats: { totalCount: number | null; streakDays: number | null; badgeCount: number | null };
  onOpenBadges: () => void;
};

/** 10 프로필 카드 + 통계 3개(prototype `.av` / `.stats`). 기록 0건이어도 0으로 표시한다. */
export function ProfileCard({ profile, stats, onOpenBadges }: Props) {
  const colors = useColors();
  const weatherColors = useWeatherColors();

  const items = [
    { label: '총 기록', value: stats.totalCount, suffix: '', onPress: undefined },
    { label: '연속', value: stats.streakDays, suffix: '일', onPress: undefined },
    { label: '뱃지', value: stats.badgeCount, suffix: '', onPress: onOpenBadges },
  ];

  return (
    <Card>
      <View style={styles.header}>
        {/* 시안의 아바타는 그림이 아니라 두 색이 섞인 원이다. 캐릭터 그림은 아직 없다(09 상점) */}
        <View
          style={styles.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <GradientFill from={weatherColors.RAINBOW} to={weatherColors.SUNNY} />
        </View>

        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>{profile.nickname}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {profile.characterName} · {formatDotDate(profile.joinedOn)} 가입
          </Text>
          {profile.plus ? <Chip label="Jelly Plus" accessibilityLabel="Jelly Plus 구독 중" /> : null}
        </View>
      </View>

      <View style={styles.stats}>
        {items.map((item) => {
          const text = item.value === null ? '-' : `${item.value}${item.suffix}`;
          const body = (
            <>
              <Text style={[styles.statValue, { color: colors.text }]}>{text}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </>
          );

          if (!item.onPress) {
            return (
              <View
                key={item.label}
                accessible
                accessibilityLabel={`${item.label} ${text}`}
                style={styles.stat}
              >
                {body}
              </View>
            );
          }

          return (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ${text}, 뱃지 컬렉션 열기`}
              style={({ pressed }) => [styles.stat, { opacity: pressed ? 0.6 : 1 }]}
            >
              {body}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  avatar: { width: 64, height: 64, borderRadius: radius.full, overflow: 'hidden' },
  identity: { flex: 1, alignItems: 'flex-start', gap: space[1] },
  name: { fontSize: font.xl, fontFamily: font.bold },
  meta: { fontSize: font.xs, fontFamily: font.regular },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: { fontSize: font.base, fontFamily: font.bold, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: font.xs, fontFamily: font.regular },
});
