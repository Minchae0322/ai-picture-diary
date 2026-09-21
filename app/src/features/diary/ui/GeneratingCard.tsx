import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 03 AI 생성 중. 진행 문구는 서버 상태로만 바뀐다 - 가짜 진행률을 만들지 않는다. */
export function GeneratingCard({ content }: { content: string }) {
  const colors = useColors();
  return (
    <Card>
      <Text style={[styles.quote, { color: colors.textMuted }]}>“{content}”</Text>
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>AI가 오늘을 그리는 중...</Text>
      </View>
      <Text style={[styles.sub, { color: colors.textSubtle }]}>감정 분석 · 이미지 생성</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  quote: { fontSize: font.sm },
  loader: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  title: { fontSize: font.base, fontWeight: font.weightBold },
  sub: { fontSize: font.xs },
});
