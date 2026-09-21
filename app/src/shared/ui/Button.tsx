import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { buttonHeight, font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  label: string;
  onPress: () => void;
  size?: keyof typeof buttonHeight;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  size = 'large',
  disabled = false,
  loading = false,
  variant = 'primary',
  accessibilityHint,
}: Props) {
  const colors = useColors();
  const blocked = disabled || loading;
  const height = buttonHeight[size];

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
        {
          height,
          borderRadius: height >= buttonHeight.large ? radius.lg : radius.md,
          backgroundColor:
            variant === 'ghost' ? 'transparent' : pressed ? colors.primaryPressed : colors.primary,
          opacity: blocked ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.primaryFg} />
      ) : (
        <Text style={[styles.label, { color: variant === 'ghost' ? colors.primary : colors.primaryFg }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[6] },
  label: { fontSize: font.base, fontWeight: font.weightBold },
});
