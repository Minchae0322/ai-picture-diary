import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { formatDotDate } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
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

  const items = [
    { label: '총 기록', value: stats.totalCount, suffix: '', onPress: undefined },
    { label: '연속', value: stats.streakDays, suffix: '일', onPress: undefined },
    { label: '뱃지', value: stats.badgeCount, suffix: '', onPress: onOpenBadges },
  ];

  return (
    <Card>
      <View style={styles.header}>
        {/*
          시안의 아바타는 두 색이 섞인 원이었다. 캐릭터 9종이 생긴 뒤로는 그 원을 **캐릭터가 서는 자리**로 쓴다 -
          앱에서 사용자를 대표하는 그림이 과일 캐릭터인데 프로필만 색 덩어리면 따로 논다.
          지금은 어느 캐릭터인지 고를 길이 없어 HAPPY 로 둔다. 09 상점이 캐릭터를 실제 상품으로 들이는 날
          `profile.characterCode` 가 이 자리를 가져간다.
        */}
        <View
          style={[styles.avatar, { backgroundColor: colors.faceBg }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <EmotionFace emotion="HAPPY" size={52} />
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, alignItems: 'flex-start', gap: space[1] },
  name: { fontSize: font.xl, fontFamily: font.bold },
  meta: { fontSize: font.xs, fontFamily: font.regular },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: { fontSize: font.base, fontFamily: font.bold, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: font.xs, fontFamily: font.regular },
});
