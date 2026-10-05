import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { font, leading } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * prototype.html 의 글자 단계를 그대로 옮긴 네 벌. 화면마다 fontSize 를 다시 고르지 않는다.
 * 화면 이름(`.h1` 34)은 `ScreenHeader` 가 쥐고 있다.
 *
 * | 여기 | prototype | 크기 / 굵기 / 색 |
 * |---|---|---|
 * | `Heading` | `.h2` | 17 bold, text - 카드 제목 |
 * | `Label`   | `.h3` | 14 bold, text - 카드 밖 섹션 이름 |
 * | `Muted`   | `.mut`| 13 regular, textMuted - 본문 보조 |
 * | `Note`    | `.sub`| 12 regular, textSubtle - 각주 |
 */
export function Heading({ children, style, numberOfLines }: Props) {
  const colors = useColors();
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[styles.heading, { color: colors.text }, style]}
    >
      {children}
    </Text>
  );
}

export function Label({ children, style, numberOfLines }: Props) {
  const colors = useColors();
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[styles.label, { color: colors.text }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: Props) {
  const colors = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.muted, { color: colors.textMuted }, style]}>
      {children}
    </Text>
  );
}

export function Note({ children, style, numberOfLines }: Props) {
  const colors = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.note, { color: colors.textSubtle }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.bold },
  label: { fontSize: font.base, fontFamily: font.bold },
  muted: { fontSize: font.sm, lineHeight: leading(font.sm), fontFamily: font.regular },
  note: { fontSize: font.xs, lineHeight: leading(font.xs), fontFamily: font.regular },
});
