import { StyleSheet, Text, View } from 'react-native';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EMOTION_LABEL, type Emotion } from '@/shared/emotion';

/** 05 이번 달 요약. 수치는 서버가 계산한 값 그대로 쓴다 - 클라이언트가 다시 세지 않는다. */
export function MonthSummary({ summary }: { summary: { emotion: Emotion; days: number }[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {summary.map((item) => (
        <View key={item.emotion} accessible style={styles.item}>
          <Text style={[styles.days, { color: colors.text }]}>{item.days}일</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>{EMOTION_LABEL[item.emotion]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  item: { alignItems: 'center', minWidth: 60, gap: 2 },
  days: { fontSize: font.base, fontFamily: font.bold },
  label: { fontSize: font.xs , fontFamily: font.regular},
});
