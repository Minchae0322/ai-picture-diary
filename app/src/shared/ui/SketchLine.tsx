import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { sketchPath, type Point } from './sketch';

type Props = {
    color: string;
    /** 물결의 진폭(px). 0 이면 떨림만 남은 거의 곧은 선 */
    sway?: number;
    /** 물결 한 주기의 길이(px). 짧으면 잔물결, 길면 느슨하게 휜 선 */
    wavelength?: number;
    strokeWidth?: number;
    roughness?: number;
    /** 같은 자리는 늘 같은 선이어야 한다. 자리마다 다른 수를 준다 */
    seed?: number;
    opacity?: number;
    /** 선이 차지할 높이. 진폭보다 넉넉해야 물결의 위아래가 잘리지 않는다 */
    height?: number;
    style?: ViewStyle;
};

/**
 * 손으로 그은 선 한 줄. **제목 아래 물결 밑줄과 구분선**이 쓴다(`hand-drawn-ui` 4장).
 *
 * <p>자로 잰 `borderBottomWidth` 나 1px `View` 대신 쓴다. 직선 한 줄이 남아 있으면
 * 주변을 다 떨어 놓아도 그 선 하나가 "기계로 그린 화면"이라고 말한다.
 *
 * <p>폭은 `onLayout` 으로 재서 부모를 꽉 채운다 - 호출부가 px 을 세지 않는다.
 * 선은 `SketchBorder` 와 같은 방식으로 **두 번** 긋는다.
 */
export function SketchLine({
    color,
    sway = 2.2,
    wavelength = 46,
    strokeWidth = 2,
    roughness = 1.2,
    seed = 5,
    opacity = 1,
    height = 10,
    style,
}: Props) {
    const [width, setWidth] = useState(0);

    const onLayout = (event: LayoutChangeEvent) => {
        const measured = Math.round(event.nativeEvent.layout.width);
        if (measured !== width) {
            setWidth(measured);
        }
    };

    const paths = useMemo(() => {
        if (width < 12) {
            return null;
        }
        const points: Point[] = [];
        const span = width - 4;
        const count = Math.max(2, Math.round(span / 7));
        for (let i = 0; i <= count; i += 1) {
            const x = 2 + (span * i) / count;
            points.push([x, height / 2 + Math.sin((x / wavelength) * Math.PI * 2) * sway]);
        }
        return {
            main: sketchPath(points, roughness, 0.4, seed, false),
            echo: sketchPath(points, roughness * 0.8, 0.4, seed + 977, false),
        };
    }, [width, height, sway, wavelength, roughness, seed]);

    return (
        <View onLayout={onLayout} style={[{ height }, style]} pointerEvents="none">
            {paths ? (
                <Svg width={width} height={height}>
                    {/* 겹쳐 그은 자국. 연하고 살짝 어긋나야 한 번에 못 그은 선으로 보인다 */}
                    <Path
                        d={paths.echo}
                        stroke={color}
                        strokeWidth={strokeWidth * 0.8}
                        strokeOpacity={0.4 * opacity}
                        strokeLinecap="round"
                        fill="none"
                        translateX={0.6}
                        translateY={0.5}
                    />
                    <Path
                        d={paths.main}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
            ) : null}
        </View>
    );
}
