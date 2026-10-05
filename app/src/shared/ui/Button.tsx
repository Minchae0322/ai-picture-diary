import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { buttonHeight, font, MIN_TOUCH_TARGET, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  label: string;
  onPress: () => void;
  size?: keyof typeof buttonHeight;
  disabled?: boolean;
  loading?: boolean;
  /** solid = 시안 CTA / soft = 흰 카드 위 보조 행동 / ghost = 텍스트 버튼 */
  variant?: 'solid' | 'soft' | 'ghost';
  /** inline = 내용만큼 / block = 부모 전체 (design-system 5.5장) */
  width?: 'inline' | 'block';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const LABEL_SIZE: Record<keyof typeof buttonHeight, number> = {
  small: font.sm,
  medium: font.base,
  large: font.md,
  xlarge: font.lg,
};

/** 시안의 버튼은 전부 알약이다. 라운드를 크기별로 다시 정하지 않는다 */
export function Button({
  label,
  onPress,
  size = 'large',
  disabled = false,
  loading = false,
  variant = 'solid',
  width = 'inline',
  accessibilityHint,
  style,
}: Props) {
  const colors = useColors();
  const blocked = disabled || loading;
  const height = buttonHeight[size];
  const fg = variant === 'solid' ? colors.primaryFg : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      accessibilityHint={accessibilityHint}
      hitSlop={Math.max(0, (MIN_TOUCH_TARGET - height) / 2)}
      style={({ pressed }) => [
        styles.base,
        variant === 'solid' && shadow.sm,
        {
          height,
          alignSelf: width === 'block' ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'small' ? space[4] : space[6],
          backgroundColor:
            variant === 'ghost'
              ? 'transparent'
              : variant === 'soft'
                ? colors.surfaceSolid
                : pressed
                  ? colors.primaryPressed
                  : colors.primary,
          borderColor: variant === 'soft' ? colors.borderStrong : 'transparent',
          borderWidth: variant === 'soft' ? 1.5 : 0,
          shadowColor: colors.primaryShadow,
          opacity: blocked ? 0.45 : pressed && variant !== 'solid' ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text numberOfLines={1} style={[styles.label, { color: fg, fontSize: LABEL_SIZE[size] , fontFamily: font.regular}]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  label: { fontFamily: font.bold },
});
