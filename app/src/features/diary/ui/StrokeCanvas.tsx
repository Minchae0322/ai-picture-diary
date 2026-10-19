import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
    Canvas,
    DashPathEffect,
    DiscretePathEffect,
    Group,
    Path,
    Skia,
} from '@shopify/react-native-skia';
import type { PenTool } from './penTools';

export type Stroke = {
    tool: PenTool;
    color: string;
    width: number;
    points: Array<[number, number]>;
    segments?: Array<{ d: string; width: number }>;
    d: string;
};

/**
 * 획을 그리는 층. **Skia 로 그린다.**
 *
 * <p>처음에는 `react-native-svg` 로 그렸는데 색연필에서 막혔다. SVG 에서 "결"을 내려면
 * `strokeDasharray` 밖에 없는데, 그 값은 <b>주기적으로 반복</b>되므로 결이 아니라 구슬을 꿴 것처럼 보인다.
 * 결은 규칙이 없어야 한다.
 *
 * <p>Skia 의 `DiscretePathEffect` 는 경로를 짧은 토막으로 잘라 <b>토막마다 난수로 밀어</b> 준다.
 * 주기가 없으니 진짜 손이 떨린 선이 되고, 이걸 진하기·굵기를 달리해 여러 번 겹치면 색연필의
 * 눌린 자국이 된다. SVG 로는 낼 수 없는 그림이다.
 *
 * <p>Skia 를 들인 이유가 하나 더 있다. 캔버스를 <b>그림 파일로 구울 수 있다</b>
 * (`makeImageSnapshot`). 덧그린 결과를 저장하려면 결국 이 기능이 필요하다.
 */
export function StrokeCanvas({ strokes, style }: { strokes: Stroke[]; style?: object }) {
    const paths = useMemo(
        () =>
            strokes.map((stroke) => ({
                stroke,
                path: Skia.Path.MakeFromSVGString(stroke.d),
                segments: stroke.segments?.map((segment) => ({
                    path: Skia.Path.MakeFromSVGString(segment.d),
                    width: segment.width,
                })),
            })),
        [strokes],
    );

    return (
        <Canvas style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
            {paths.map((item, index) => (
                <StrokeArt key={index} {...item} />
            ))}
        </Canvas>
    );
}

/**
 * 색연필의 겹쳐 칠하기. 패스마다 **흔들림의 크기와 토막 길이가 다르다** -
 * 같은 값으로 여러 번 그으면 그냥 굵은 선이 된다.
 */
const PENCIL_PASSES = [
    { length: 4.5, deviation: 0.9, scale: 1.0, opacity: 0.34, seed: 11 },
    { length: 3.0, deviation: 1.7, scale: 0.72, opacity: 0.26, seed: 29 },
    { length: 2.2, deviation: 2.5, scale: 0.5, opacity: 0.2, seed: 53 },
];

function StrokeArt({
    stroke,
    path,
    segments,
}: {
    stroke: Stroke;
    path: ReturnType<typeof Skia.Path.MakeFromSVGString>;
    segments?: Array<{ path: ReturnType<typeof Skia.Path.MakeFromSVGString>; width: number }>;
}) {
    const { tool, color, width } = stroke;

    if (tool === 'brush' && segments) {
        return (
            <Group>
                {segments.map((segment, index) =>
                    segment.path ? (
                        <Path
                            key={index}
                            path={segment.path}
                            style="stroke"
                            color={color}
                            strokeWidth={segment.width}
                            strokeCap="round"
                            opacity={0.92}
                        />
                    ) : null,
                )}
            </Group>
        );
    }

    if (!path) {
        return null;
    }

    if (tool === 'colored') {
        return (
            <Group>
                {PENCIL_PASSES.map((pass, index) => (
                    <Path
                        key={index}
                        path={path}
                        style="stroke"
                        color={color}
                        strokeWidth={width * pass.scale}
                        strokeCap="round"
                        strokeJoin="round"
                        opacity={pass.opacity}
                    >
                        {/* 토막마다 난수로 민다. 주기가 없어 결처럼 보인다 */}
                        <DiscretePathEffect length={pass.length} deviation={pass.deviation} seed={pass.seed} />
                    </Path>
                ))}
            </Group>
        );
    }

    if (tool === 'pencil') {
        return (
            <Path
                path={path}
                style="stroke"
                color={color}
                strokeWidth={width * 0.75}
                strokeCap="round"
                opacity={0.8}
            >
                {/* 흑연은 결에 걸려 끊긴다. 흔들림 + 짧은 끊김을 같이 준다 */}
                <DiscretePathEffect length={3} deviation={0.7} seed={7} />
                <DashPathEffect intervals={[6, 1.2]} />
            </Path>
        );
    }

    if (tool === 'highlighter') {
        return (
            <Path
                path={path}
                style="stroke"
                color={color}
                strokeWidth={width * 3.5}
                // 납작한 펜촉이라 끝이 각지다
                strokeCap="butt"
                strokeJoin="round"
                opacity={0.26}
            />
        );
    }

    return (
        <Path
            path={path}
            style="stroke"
            color={color}
            strokeWidth={width}
            strokeCap="round"
            strokeJoin="round"
            opacity={0.95}
        />
    );
}
