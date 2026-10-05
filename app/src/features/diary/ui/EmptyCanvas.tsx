import { StyleSheet, Text, View } from 'react-native';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 시안 02 `empty-canvas`. 점선 테두리 + 큰 물음표.
 * 물음표와 테두리는 뜻을 담지 않는 장식이라 대비를 못 맞추는 accentSoft를 쓸 수 있다.
 * 캡션만 대비를 맞춘 textSubtle이다(muted-sky 2·5장).
 */
export function EmptyCanvas() {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityLabel="AI 그림이 들어갈 자리입니다. 아직 오늘 기록이 없어요"
      style={[styles.canvas, { backgroundColor: colors.surface, borderColor: `${colors.accentSoft}59` }]}
    >
      <Text
        style={[styles.glyph, { color: colors.accentSoft }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        ?
      </Text>
      <Text style={[styles.caption, { color: colors.textSubtle }]}>AI 그림 영역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
  },
  glyph: { fontSize: 44, lineHeight: 48, fontFamily: font.black },
  caption: { fontSize: font.xs, fontFamily: font.medium },
});
