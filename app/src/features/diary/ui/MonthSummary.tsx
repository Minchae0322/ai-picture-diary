import { StyleSheet, Text, View } from 'react-native';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EMOTION_LABEL, type Emotion } from '@/shared/emotion';
import { EmotionFace } from '@/shared/ui/EmotionFace';

/** prototype `.sum` 은 네 칸까지 보여준다. 여섯 칸이면 390 폭에서 글자가 겹친다 */
const MAX_ITEMS = 4;

/** 05 이번 달 요약. 수치는 서버가 계산한 값 그대로 쓴다 - 클라이언트가 다시 세지 않는다. */
export function MonthSummary({ summary }: { summary: { emotion: Emotion; days: number }[] }) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      {summary.slice(0, MAX_ITEMS).map((item) => (
        <View
          key={item.emotion}
          accessible
          accessibilityLabel={`${EMOTION_LABEL[item.emotion]} ${item.days}일`}
          style={styles.item}
        >
          {/* 색은 뜻을 나르지 않는다(emotion.ts) - 점 대신 캐릭터가 어떤 감정인지 말한다 */}
          <View style={styles.top}>
            <EmotionFace emotion={item.emotion} size={26} />
            <Text style={[styles.days, { color: colors.text }]}>{item.days}일</Text>
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {EMOTION_LABEL[item.emotion]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  item: { flex: 1, alignItems: 'center', gap: space[1] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  days: { fontSize: font.base, fontFamily: font.bold, fontVariant: ['tabular-nums'] },
  label: { fontSize: font.xs, fontFamily: font.regular },
});
