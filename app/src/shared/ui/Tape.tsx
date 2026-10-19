import { StyleSheet, View } from 'react-native';
import { SketchShape } from './SketchShape';
import { polygonPoints, TAPE_VARIANT, type Point, type RoughOptions } from './sketch';

type TapeStyle = 'smooth' | 'torn' | 'side-torn';

type Props = {
    width?: number;
    height?: number;
    /** TAPE_VARIANT 8종. 크라프트(`kraft`)가 공책 느낌에 가장 맞는다 */
    variant?: string;
    tapeStyle?: TapeStyle;
    rotate?: number;
    opacity?: number;
    /** 붙일 자리. 카드 위 귀에 하나만 붙여도 "붙여 둔 종이"가 된다 */
    style?: object;
    roughOptions?: RoughOptions;
};

/**
 * 마스킹 테이프. 원본(SketchUI `Tape`)을 React Native 로 옮긴 것이다.
 *
 * <p>이 체계에서 가장 값싸고 효과가 크다. 다만 <b>불투명도가 핵심</b>이다 - 밑이 비쳐야 테이프고,
 * 꽉 차면 그냥 색 막대다. 원본 기본값 0.85 를 쓰되 종이 위에서는 0.75 가 더 테이프 같다.
 *
 * <p>찢긴 가장자리는 톱니 꼭짓점을 직접 찍어 만든다 - 손그림 떨림만으로는 "찢긴" 것으로 안 보인다.
 */
export function Tape({
    width = 96,
    height = 28,
    variant = 'kraft',
    tapeStyle = 'smooth',
    rotate = -4,
    opacity = 0.8,
    style,
    roughOptions,
}: Props) {
    const preset = TAPE_VARIANT[variant];
    const fill = preset?.fill ?? variant;
    const seed = roughOptions?.seed ?? preset?.seed ?? 20;

    const pad = 6;
    const w = width - pad * 2;
    const h = height - pad * 2;

    let corners: Point[];
    if (tapeStyle === 'torn') {
        // 위아래를 톱니로. 가로로 붙이는 테이프의 찢긴 끝
        const top: Point[] = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 1].map((t, i) => [
            pad + w * t,
            pad + (i % 2 === 0 ? 2 : 0),
        ]);
        const bottom: Point[] = [1, 0.86, 0.74, 0.62, 0.5, 0.38, 0.26, 0.14, 0].map((t, i) => [
            pad + w * t,
            pad + h + (i % 2 === 0 ? -2 : 2),
        ]);
        corners = [...top, ...bottom];
    } else if (tapeStyle === 'side-torn') {
        const right: Point[] = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 1].map((t, i) => [
            pad + w + (i % 2 === 0 ? 2 : -3),
            pad + h * t,
        ]);
        const left: Point[] = [0.86, 0.72, 0.58, 0.44, 0.3, 0.16, 0].map((t, i) => [
            pad + (i % 2 === 0 ? -2 : 3),
            pad + h * t,
        ]);
        corners = [[pad + 4, pad], [pad + w - 4, pad], ...right, [pad + 4, pad + h], ...left];
    } else {
        corners = [
            [pad, pad],
            [pad + w, pad],
            [pad + w, pad + h],
            [pad, pad + h],
        ];
    }

    return (
        <View
            pointerEvents="none"
            style={[
                styles.root,
                { width, height, opacity, transform: [{ rotate: `${rotate}deg` }] },
                style,
            ]}
        >
            <SketchShape
                points={polygonPoints(corners, 6)}
                width={width}
                height={height}
                stroke="rgba(17,17,17,0.45)"
                fill={fill}
                options={{
                    strokeWidth: 1.2,
                    roughness: 1.4,
                    bowing: 0.8,
                    fillStyle: 'solid',
                    ...roughOptions,
                    seed,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { position: 'absolute' },
});
