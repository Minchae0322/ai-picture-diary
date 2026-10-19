import { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Path } from 'react-native-svg';
import {
    buildFill,
    ROUGH_DEFAULTS,
    sketchPath,
    solidPath,
    type Point,
    type RoughOptions,
} from './sketch';

type Props = {
    /** 도형의 둘레를 이루는 점들. `roundedRectPoints` · `ellipsePoints` · `polygonPoints` 로 만든다 */
    points: Point[];
    width: number;
    height: number;
    stroke: string;
    /** 없으면 테두리만 그린다 */
    fill?: string;
    fillOpacity?: number;
    options?: RoughOptions;
};

/**
 * 손으로 그린 도형 하나. **원본의 `rc.path(d, options)` 에 해당한다.**
 *
 * <p>버튼·뱃지·테이프·카드가 전부 이것을 쓴다. 도형마다 손그림 코드를 다시 쓰지 않는다.
 *
 * <p>그리는 순서가 중요하다.
 * <ol>
 *   <li>면을 깔고(solid 면 한 장)
 *   <li>그 위에 빗금을 잘라 얹고(ClipPath 로 도형 안쪽만)
 *   <li>맨 위에 테두리를 <b>두 번</b> 긋는다 - 한 번은 연하게 어긋나게, 한 번은 진하게
 * </ol>
 * 세 번째가 손그림의 핵심이다. 한 번에 그은 선은 사람이 그은 선으로 안 보인다.
 */
export function SketchShape({ points, width, height, stroke, fill, fillOpacity = 1, options }: Props) {
    const o = { ...ROUGH_DEFAULTS, ...options };

    const art = useMemo(() => {
        const clip = solidPath(points);
        return {
            clip,
            outline: sketchPath(points, o.roughness, o.bowing, o.seed),
            echo: sketchPath(points, o.roughness * 0.75, o.bowing, o.seed + 977),
            fill: buildFill(width, height, o.fillStyle, o.hachureGap, o.hachureAngle, o.seed, o.roughness),
        };
        // 점 배열은 매 렌더 새로 만들어지므로 좌표 개수와 수치만 의존성으로 둔다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        width,
        height,
        points.length,
        o.roughness,
        o.bowing,
        o.seed,
        o.fillStyle,
        o.hachureGap,
        o.hachureAngle,
    ]);

    const clipId = `sketchClip${o.seed}`;
    const hatched = o.fillStyle !== 'solid' && fill !== undefined;

    return (
        <Svg width={width} height={height} pointerEvents="none">
            <Defs>
                <ClipPath id={clipId}>
                    <Path d={art.clip} />
                </ClipPath>
            </Defs>

            {/* 1. 면. 빗금 계열이면 연하게 깔아 종이색이 비치게 한다 */}
            {fill ? (
                <Path d={art.clip} fill={fill} fillOpacity={hatched ? fillOpacity * 0.35 : fillOpacity} />
            ) : null}

            {/* 2. 채우기 - 도형 안쪽만 남긴다 */}
            {hatched ? (
                <G clipPath={`url(#${clipId})`}>
                    {art.fill.lines.map((line, index) => (
                        <Line
                            key={`h${index}`}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke={fill}
                            strokeWidth={1.3}
                            strokeOpacity={0.95}
                            strokeLinecap="round"
                        />
                    ))}
                    {art.fill.zigzag ? (
                        <Path
                            d={art.fill.zigzag}
                            stroke={fill}
                            strokeWidth={1.3}
                            fill="none"
                            strokeLinecap="round"
                        />
                    ) : null}
                    {art.fill.dots.map((dot, index) => (
                        <Circle key={`d${index}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} />
                    ))}
                </G>
            ) : null}

            {/* 3. 테두리를 두 번. 이게 없으면 아무리 떨어도 기계 선이다 */}
            <Path
                d={art.echo}
                stroke={stroke}
                strokeWidth={o.strokeWidth * 0.8}
                strokeOpacity={0.38}
                strokeLinecap="round"
                fill="none"
                translateX={0.6}
                translateY={0.5}
            />
            <Path
                d={art.outline}
                stroke={stroke}
                strokeWidth={o.strokeWidth}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
}
