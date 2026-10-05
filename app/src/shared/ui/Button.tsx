import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import {
  buttonFontSize,
  buttonHeight,
  font,
  MIN_TOUCH_TARGET,
  radius,
  space,
} from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Variant = 'primary' | 'soft' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  size?: keyof typeof buttonHeight;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  /** 가로로 늘어나 남는 공간을 나눠 갖는다(04 액션 3개의 `.actions .btn { flex: 1 }`) */
  fill?: boolean;
  accessibilityHint?: string;
};

/**
 * prototype.html `.btn` 과 같은 모양. **알약(radius.full)** 이고 굵기는 bold 하나다.
 *
 * 변형 3종:
 * - `primary` 찬 브랜드면. `xlarge` 일 때만 브랜드색 그림자를 깐다(`.btn.xl`)
 * - `soft`    흰 면 + 브랜드 글자 + 1.5px 테두리. 한 화면에 주 버튼이 둘 이상일 때(04 액션 3개)
 * - `ghost`   면 없음. 목록 끝의 보조 동작("구매 복원")
 */
export function Button({
  label,
  onPress,
  size = 'large',
  disabled = false,
  loading = false,
  variant = 'primary',
  fill = false,
  accessibilityHint,
}: Props) {
  const colors = useColors();
  const blocked = disabled || loading;
  const height = buttonHeight[size];
  const fg = variant === 'primary' ? colors.primaryFg : colors.primary;

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
        // 큰 버튼은 폭을 다 쓴다(`.btn.xl { width: 100% }`). 작은 버튼은 글자만큼
        size === 'xlarge' && styles.block,
        fill && styles.fill,
        size === 'xlarge' && variant === 'primary' && brandShadow(colors.primaryShadow),
        {
          height,
          paddingHorizontal: height <= buttonHeight.small ? space[4] : space[6],
          backgroundColor: background(variant, colors, pressed),
          borderWidth: variant === 'soft' ? 1.5 : 0,
          borderColor: pressed ? colors.primary : colors.borderStrong,
          opacity: blocked ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { fontSize: buttonFontSize[size], color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

function background(variant: Variant, colors: ReturnType<typeof useColors>, pressed: boolean) {
  if (variant === 'ghost') {
    return 'transparent';
  }
  if (variant === 'soft') {
    return colors.surfaceSolid;
  }
  return pressed ? colors.primaryPressed : colors.primary;
}

/** `.btn.xl` 의 `0 10px 22px var(--primary-shadow)`. 색이 토큰이라 스타일시트에 넣을 수 없다 */
const brandShadow = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 1,
  shadowRadius: 11,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    borderRadius: radius.full,
  },
  block: { alignSelf: 'stretch', width: '100%' },
  fill: { flex: 1, paddingHorizontal: space[3] },
  label: { fontFamily: font.bold },
});
