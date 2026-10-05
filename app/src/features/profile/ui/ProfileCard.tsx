import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Card } from '@/shared/ui/Card';

export type ProfileStat = { id: string; label: string; value: string; onPress?: () => void };

type Props = {
  nickname: string;
  character: string;
  joinedAt: string;
  plus: boolean;
  stats: ProfileStat[];
};

/** 시안 10 `card`. 기록 0건이어도 통계를 0으로 보여준다(숨기지 않는다) */
export function ProfileCard({ nickname, character, joinedAt, plus, stats }: Props) {
  const colors = useColors();

  return (
    <Card>
      <View style={styles.head}>
        <LinearGradient
          colors={[weatherColor.RAINBOW, weatherColor.SUNNY] as const}
          style={styles.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.headText}>
          <Text accessibilityRole="header" style={[styles.nickname, { color: colors.text }]}>
            {nickname}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {character} · {joinedAt} 가입
          </Text>
          {plus ? (
            <View style={[styles.plus, { backgroundColor: colors.surfaceSolid, borderColor: colors.borderStrong }]}>
              <Text style={[styles.plusLabel, { color: colors.text }]}>Jelly Plus</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => {
          const body = (
            <>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </>
          );
          if (stat.onPress === undefined) {
            return (
              <View key={stat.id} accessible accessibilityLabel={`${stat.label} ${stat.value}`} style={styles.stat}>
                {body}
              </View>
            );
          }
          return (
            <Pressable
              key={stat.id}
              onPress={stat.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${stat.label} ${stat.value}`}
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
  head: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  avatar: { width: 64, height: 64, borderRadius: radius.full },
  headText: { flex: 1, gap: space[1], alignItems: 'flex-start' },
  nickname: { fontSize: font.xl, lineHeight: leading(font.xl, 1.1), fontFamily: font.bold },
  meta: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs, 1.1) },
  plus: {
    paddingHorizontal: space[3],
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  plusLabel: { fontSize: font.xs, lineHeight: 15, fontFamily: font.bold },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: { fontSize: font.base, lineHeight: leading(font.base, 1.2), fontFamily: font.bold },
  statLabel: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs, 1.1) },
});
