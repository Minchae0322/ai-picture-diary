import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, leading, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

/**
 * prototype.html 의 `.h1` 머리. 05~10 이 같은 크기(34)를 쓴다 - 화면 이름이 가장 큰 글자다.
 * 뒤로가기는 제목 **위 줄**에 둔다(prototype 07·09 의 `.link`). 제목 옆에 두면 34px 글자와
 * 높이가 맞지 않아 제목이 밀린다.
 */
export function ScreenHeader({ title, subtitle, onBack }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.backMark, { color: colors.textMuted }]}>←</Text>
        </Pressable>
      ) : null}

      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  back: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignSelf: 'flex-start' },
  backMark: { fontSize: font.lg, fontFamily: font.medium },
  title: {
    fontSize: font.display,
    lineHeight: leading(font.display, 1.04),
    fontFamily: font.black,
    letterSpacing: -0.85,
  },
  subtitle: { fontSize: font.base, fontFamily: font.regular, lineHeight: leading(font.base) },
});
