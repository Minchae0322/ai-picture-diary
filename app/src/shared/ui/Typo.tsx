import { StyleSheet, Text, type TextProps } from 'react-native';
import { font, leading } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 시안의 화면 제목(34px black). 05~10의 "감정 캘린더", "MY" 등 */
export function ScreenTitle({ children, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <Text accessibilityRole="header" style={[styles.screen, { color: colors.text }]} {...rest}>
      {children}
    </Text>
  );
}

/** 카드 안/섹션의 제목(17px bold) */
export function SectionTitle({ children, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]} {...rest}>
      {children}
    </Text>
  );
}

/** 배경 위 보조 텍스트. textSubtle이 아니라 textMuted를 쓴다(muted-sky 2장) */
export function Muted({ children, style, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <Text style={[styles.muted, { color: colors.textMuted }, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { fontSize: font.display, lineHeight: leading(font.display, 1.02), fontFamily: font.black },
  section: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.bold },
  muted: { fontSize: font.sm, fontFamily: font.regular, lineHeight: leading(font.sm) },
});
