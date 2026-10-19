import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SketchShape } from './SketchShape';
import {
    polygonPoints,
    roundedRectPoints,
    seedFromString,
    SKETCH_VARIANT,
    type FillStyle,
    type Point,
    type RoughOptions,
} from './sketch';
import { font, MIN_TOUCH_TARGET } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
    children: ReactNode;
    onPress?: () => void;
    /** 프리셋 이름이거나 색 그 자체. 색을 주면 seed 를 글자에서 뽑는다 */
    variant?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    cornerRadius?: number;
    fillStyle?: FillStyle;
    disabled?: boolean;
    /** 종이가 떠 있는 두께. 옆면과 바닥면을 빗금으로 채운다 */
    enable3D?: boolean;
    depth?: number;
    depthAngle?: number;
    roughOptions?: RoughOptions;
    accessibilityHint?: string;
};

/**
 * 손그림 버튼. 원본(SketchUI `Button`)을 React Native 로 옮긴 것이다.
 *
 * <p><b>웹과 달라지는 두 가지</b>
 * <ol>
 *   <li><b>hover 가 없다.</b> 원본은 hover 에서 `roughness` 1.4 -> 1.9, `hachureGap` 5 -> 0.75 로
 *       바꿔 "더 세게 칠한" 느낌을 낸다. 모바일에는 hover 가 없으므로 <b>눌림(pressed)</b> 이 그 자리를 받는다.
 *   <li><b>기울이지 않는다.</b> 원본의 `hoverRotate: -1deg` 는 마우스 커서 아래서만 자연스럽다.
 *       손가락으로 누르는 과녁이 돌아가면 빗나간다. 대신 1px 내려앉는다.
 * </ol>
 *
 * <p>글자는 SVG 안에 넣지 않고 <b>위에 따로 얹는다</b> - 원본도 그렇다. 빗금 위에 글자를 그리면
 * 읽을 수 없고, SVG 텍스트는 폰트 패밀리를 RN 과 다르게 다룬다.
 */
export function SketchButton({
    children,
    onPress,
    variant = 'yellow',
    width = 180,
    height = 48,
    fontSize = 17,
    cornerRadius = 12,
    fillStyle = 'hachure',
    disabled = false,
    enable3D = false,
    depth = 12,
    depthAngle = 35,
    roughOptions,
    accessibilityHint,
}: Props) {
    const colors = useColors();
    const [pressed, setPressed] = useState(false);

    const preset = SKETCH_VARIANT[variant];
    const fill = preset?.fill ?? variant;
    const seed = roughOptions?.seed ?? preset?.seed ?? seedFromString(variant);

    // 눌리면 더 세게 칠한 것처럼. 원본의 hover 값을 그대로 쓴다
    const roughness = pressed ? 1.9 : (roughOptions?.roughness ?? 1.4);
    const hachureGap = pressed ? 0.75 : (roughOptions?.hachureGap ?? 5);

    const angle = (depthAngle * Math.PI) / 180;
    const dx = enable3D ? Math.cos(angle) * depth : 0;
    const dy = enable3D ? Math.sin(angle) * depth : 0;

    // 떨리는 선이 상자 밖으로 삐져나가므로 캔버스를 여유 있게 잡는다(원본의 x·y 여백)
    const pad = 5;
    const canvasWidth = width + pad * 2 + Math.abs(dx);
    const canvasHeight = height + pad * 2 + Math.abs(dy);

    const face = roundedRectPoints(pad, pad, width, height, cornerRadius);
    const right: Point[] = polygonPoints([
        [pad + width, pad],
        [pad + width + dx, pad + dy],
        [pad + width + dx, pad + height + dy],
        [pad + width, pad + height],
    ]);
    const bottom: Point[] = polygonPoints([
        [pad, pad + height],
        [pad + width, pad + height],
        [pad + width + dx, pad + height + dy],
        [pad + dx, pad + height + dy],
    ]);

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            accessibilityHint={accessibilityHint}
            hitSlop={Math.max(0, (MIN_TOUCH_TARGET - height) / 2)}
            style={[
                { width: canvasWidth, height: canvasHeight },
                styles.root,
                disabled ? styles.disabled : null,
                // 눌리면 1px 내려앉는다. 회전은 주지 않는다 - 움직이는 과녁은 못 누른다
                pressed ? styles.pressed : null,
            ]}
        >
            {enable3D ? (
                <>
                    <View style={StyleSheet.absoluteFill}>
                        <SketchShape
                            points={right}
                            width={canvasWidth}
                            height={canvasHeight}
                            stroke={colors.text}
                            fill="#fffbf2"
                            options={{
                                seed: seed + 10,
                                roughness: roughness + 0.35,
                                hachureGap: 5,
                                hachureAngle: 85,
                                fillStyle: 'hachure',
                            }}
                        />
                    </View>
                    <View style={StyleSheet.absoluteFill}>
                        <SketchShape
                            points={bottom}
                            width={canvasWidth}
                            height={canvasHeight}
                            stroke={colors.text}
                            fill="#fffbf2"
                            options={{
                                seed: seed + 20,
                                roughness: roughness + 0.35,
                                hachureGap: 5,
                                hachureAngle: -35,
                                fillStyle: 'hachure',
                            }}
                        />
                    </View>
                </>
            ) : null}

            <View style={StyleSheet.absoluteFill}>
                <SketchShape
                    points={face}
                    width={canvasWidth}
                    height={canvasHeight}
                    stroke={colors.text}
                    fill={fill}
                    options={{
                        ...roughOptions,
                        seed,
                        roughness,
                        hachureGap,
                        fillStyle,
                        hachureAngle: roughOptions?.hachureAngle ?? -10,
                    }}
                />
            </View>

            {/* 글자는 도형 위에 따로. 빗금 위에 그리면 읽을 수 없다 */}
            <View style={[styles.labelBox, { width, height, left: pad, top: pad }]}>
                <Text numberOfLines={1} style={[styles.label, { fontSize, color: colors.text }]}>
                    {children}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { alignSelf: 'flex-start' },
    pressed: { transform: [{ translateY: 1 }] },
    disabled: { opacity: 0.45 },
    labelBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: font.bold },
});
