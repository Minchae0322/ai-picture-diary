import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SketchShape } from './SketchShape';
import {
    ellipsePoints,
    roundedRectPoints,
    SKETCH_VARIANT,
    type FillStyle,
    type RoughOptions,
} from './sketch';
import { font } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Shape = 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'circle';

type Props = {
    children: ReactNode;
    width?: number;
    height?: number;
    fontSize?: number;
    shape?: Shape;
    /** SKETCH_VARIANT 의 이름 10종 중 하나 */
    variant?: string;
    /** 면 없이 테두리만. 연한 상태 표시에 쓴다 */
    transparent?: boolean;
    fillStyle?: FillStyle;
    radius?: number;
    roughOptions?: RoughOptions;
    accessibilityLabel?: string;
};

/**
 * 손그림 뱃지. 원본(SketchUI `Badge`)을 React Native 로 옮긴 것이다.
 *
 * <p>버튼보다 선이 얇고(1.4) 떨림이 적다(1.2) - 작은 도형에 같은 떨림을 주면 글자를 삼킨다.
 * 원본의 기본값을 그대로 따랐다.
 */
export function SketchBadge({
    children,
    width = 92,
    height = 34,
    fontSize = 13,
    shape = 'rounded-rectangle',
    variant = 'yellow',
    transparent = false,
    fillStyle = 'hachure',
    radius = 12,
    roughOptions,
    accessibilityLabel,
}: Props) {
    const colors = useColors();
    const preset = SKETCH_VARIANT[variant];
    const fill = preset?.fill ?? variant;
    const seed = roughOptions?.seed ?? preset?.seed ?? 20;

    const pad = 4;
    const canvasWidth = width + pad * 2;
    const canvasHeight = height + pad * 2;

    const size = Math.min(width, height);
    const points =
        shape === 'ellipse'
            ? ellipsePoints(pad + width / 2, pad + height / 2, width, height)
            : shape === 'circle'
              ? ellipsePoints(pad + width / 2, pad + height / 2, size, size)
              : roundedRectPoints(pad, pad, width, height, shape === 'rectangle' ? 2 : radius);

    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            style={[styles.root, { width: canvasWidth, height: canvasHeight }]}
        >
            <View style={StyleSheet.absoluteFill}>
                <SketchShape
                    points={points}
                    width={canvasWidth}
                    height={canvasHeight}
                    stroke={colors.text}
                    fill={transparent ? undefined : fill}
                    options={{
                        strokeWidth: 1.4,
                        roughness: 1.2,
                        bowing: 0.7,
                        hachureGap: 5,
                        hachureAngle: -10,
                        fillStyle,
                        ...roughOptions,
                        seed,
                    }}
                />
            </View>

            <View style={[styles.labelBox, { width, height, left: pad, top: pad }]}>
                <Text numberOfLines={1} style={[styles.label, { fontSize, color: colors.text }]}>
                    {children}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { alignSelf: 'flex-start' },
    labelBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: font.bold },
});
