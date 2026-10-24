import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { makeRandom } from './sketch';

/**
 * 종이 결. 바탕 세 겹의 **둘째**다(`paper-background` 1장) - 색 하나와 질감만으로 화면이 가장 크게 바뀐다.
 *
 * <p>웹은 `feTurbulence` 로 노이즈를 만들지만 `react-native-svg` 는 그 필터를 지원하지 않는다.
 * 대신 **점을 흩뿌린다.** 아주 연한 작은 원 수백 개면 종이의 거친 면이 된다.
 *
 * <p>좌표는 0~1 의 **비율**로 한 번만 뽑아 두고 그릴 때 창 크기를 곱한다. **매 렌더 새로 뽑으면
 * 종이가 끓는다** - 가만히 있어야 종이다.
 *
 * <p>**점은 둥글어야 한다.** 한때 `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` 으로 깔았는데,
 * 세로가 가로의 2.2 배인 화면에서 원이 그만큼 늘어나 세로 줄무늬가 됐다 - 종이 결이 아니라 **비 내리는
 * 자국**으로 읽힌다. 불투명도가 제곱으로 깎여 안 보이던 동안 드러나지 않았던 결함이다.
 * 그래서 viewBox 를 포인트 좌표로 두고 반지름도 포인트로 준다.
 *
 * <p>**바탕의 질감은 이 겹 하나가 전부다.** 모눈은 깔지 않는다(2026-10-25) - 바탕이 조용해야
 * 그 위에 손으로 그린 선이 먼저 읽힌다. 그래서 농도를 눈으로 고르지 말고 3장의 값을 지킨다.
 */
const GRAIN = (() => {
    const rand = makeRandom(4242);
    return Array.from({ length: 1400 }, () => ({
        /** 창 크기에 곱할 비율 */
        fx: rand(),
        fy: rand(),
        /** 포인트 단위 반지름. 1pt 를 넘으면 점이 아니라 얼룩으로 보인다 */
        r: 0.35 + rand() * 0.55,
        /** 겹 **안에서의** 상대 농도. 실제 농도는 여기에 겹 불투명도를 곱한 값이다 */
        o: 0.55 + rand() * 0.45,
    }));
})();

type Props = {
    color?: string;
    /**
     * 겹 전체의 불투명도. 호출부는 한 값만 주고 점의 상대 농도와 곱해져 `fillOpacity` 로 내려간다
     * (`paper-background` 3장). 점이 실제로 덮는 면적은 0.7%(실측)라 글줄 대비를 바꾸지 않지만,
     * 9% 를 넘기면 다시 확인한다 - 거기부터는 점이 아니라 흐린 막이 된다.
     *
     * <p>**뷰 스타일로 주지 않는다.** `react-native-svg` 가 그 값을 네이티브 뷰와 SVG 루트에
     * **두 번** 먹여 제곱이 된다 - 0.09 가 0.008 로 그려져 결이 거의 사라진다
     * (시뮬레이터 실측: 0.2 를 주면 0.04 로 그려졌다).
     */
    opacity?: number;
};

export function PaperGrain({ color = '#3B3B3B', opacity = 0.09 }: Props) {
    const { width, height } = useWindowDimensions();

    const dots = useMemo(
        () => GRAIN.map((dot) => ({ ...dot, cx: dot.fx * width, cy: dot.fy * height })),
        [width, height],
    );

    return (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {dots.map((dot, index) => (
                <Circle
                    key={index}
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r}
                    fill={color}
                    fillOpacity={dot.o * opacity}
                />
            ))}
        </Svg>
    );
}
