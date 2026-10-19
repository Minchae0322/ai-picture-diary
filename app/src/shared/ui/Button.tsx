import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SketchShape } from '@/shared/ui/SketchShape';
import { roundedRectPoints, seedFromString } from '@/shared/ui/sketch';
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
 * prototype.html `.btn` 과 같은 모양. **알약**이고 굵기는 bold 하나다.
 *
 * <p>**면과 테두리를 손으로 그린다**(`hand-drawn-ui`). 자로 잰 `borderWidth` 대신
 * `SketchShape` 가 떨리는 선을 두 번 긋는다. 폭이 호출부마다 달라서(`fill`, `xlarge` 는 100%)
 * `onLayout` 으로 실제 크기를 재고 나서 그린다 - 재기 전에는 선 없이 면만 보인다.
 *
 * <p>**채우기는 `solid` 다.** 빗금 위에 글자를 얹으면 읽을 수 없다(같은 스킬 1장).
 * 손그림 티는 테두리가 낸다.
 *
 * 변형 3종:
 * - `primary` 찬 브랜드면. `xlarge` 일 때만 브랜드색 그림자를 깐다(`.btn.xl`)
 * - `soft`    흰 면 + 브랜드 글자 + 손그림 테두리. 한 화면에 주 버튼이 둘 이상일 때(04 액션 3개)
 * - `ghost`   면도 선도 없음. 목록 끝의 보조 동작("구매 복원")
 *
 * **라벨은 한 줄이다.** 줄바꿈을 허용하면 알약이 두 줄로 부풀어 같은 줄의 다른 버튼과 높이가 어긋난다
 * (04 의 "다시 그리기"가 실제로 `다시그리 기` 로 접혔다). `fill` 로 폭을 나눠 가질 때는 글자 크기를
 * 한 단계 내려(`font.sm`) 세 칸이 고르게 들어가게 한다.
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
  const [pressed, setPressed] = useState(false);
  const [width, setWidth] = useState(0);

  const blocked = disabled || loading;
  const height = buttonHeight[size];
  const fg = variant === 'primary' ? colors.primaryFg : colors.primary;
  const sketched = variant !== 'ghost';

  // 라벨마다 다른 선. 같은 화면의 버튼들이 똑같이 떨리면 도장 찍은 것처럼 보인다
  const seed = seedFromString(label) + height;

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    if (measured !== width) {
      setWidth(measured);
    }
  };

  // 면 색. 빗금을 쓰지 않으므로 그냥 단색이다
  const face =
    variant === 'primary' ? (pressed ? colors.primaryPressed : colors.primary) : colors.surfaceSolid;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      accessibilityHint={accessibilityHint}
      hitSlop={Math.max(0, (MIN_TOUCH_TARGET - height) / 2)}
      style={[
        styles.base,
        // 큰 버튼은 폭을 다 쓴다(`.btn.xl { width: 100% }`). 작은 버튼은 글자만큼
        size === 'xlarge' && styles.block,
        fill && styles.fill,
        size === 'xlarge' && variant === 'primary' && brandShadow(colors.primaryShadow),
        {
          height,
          paddingHorizontal: fill
            ? space[2]
            : height <= buttonHeight.small
              ? space[4]
              : space[6],
          opacity: blocked ? 0.45 : 1,
          // 눌리면 1px 내려앉는다. 회전은 주지 않는다 - 움직이는 과녁은 못 누른다
          transform: [{ translateY: pressed && !blocked ? 1 : 0 }],
        },
      ]}
    >
      {sketched && width > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SketchShape
            points={roundedRectPoints(1.5, 1.5, width - 3, height - 3, height / 2)}
            width={width}
            height={height}
            stroke={variant === 'primary' ? colors.text : colors.primary}
            fill={face}
            options={{
              seed,
              // 눌리면 선이 거칠어진다 - 원본이 hover 에서 하던 일을 여기서 받는다
              roughness: pressed ? 1.9 : 1.3,
              bowing: 0.6,
              strokeWidth: 1.6,
              fillStyle: 'solid',
            }}
          />
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.label, { fontSize: fill ? font.sm : buttonFontSize[size], color: fg }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
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
  fill: { flex: 1 },
  label: { fontFamily: font.bold },
});
