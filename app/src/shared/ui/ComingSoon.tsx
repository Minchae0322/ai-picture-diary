import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 이번 라운드 범위 밖 탭의 자리표시자. 화면 문서는 docs/screen/ 에 이미 있다. */
export function ComingSoon({ title, doc }: { title: string; doc: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingTop: insets.top + space[8] }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>다음 라운드에 붙습니다.</Text>
      <Text style={[styles.doc, { color: colors.textSubtle }]}>{doc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: space[2], paddingHorizontal: space[4] },
  title: { fontSize: font.xl, fontWeight: font.weightBold },
  body: { fontSize: font.sm },
  doc: { fontSize: font.xs },
});
