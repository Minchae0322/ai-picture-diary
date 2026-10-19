import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { makeRandom } from './sketch';

/**
 * 종이 결. 손그림 체계의 **1단계**다 - 색 하나와 질감만으로 화면이 가장 크게 바뀐다
 * (`hand-drawn-ui` 적용 순서 1번).
 *
 * <p>웹은 `feTurbulence` 로 노이즈를 만들지만 `react-native-svg` 는 그 필터를 지원하지 않는다.
 * 대신 **점을 흩뿌린다.** 불투명도 0.02~0.045 의 작은 원 수백 개면 종이의 거친 면이 된다.
 *
 * <p>좌표는 0~100 의 viewBox 비율이라 화면 크기와 무관하게 한 번만 계산한다. **매 렌더 새로 뽑으면
 * 종이가 끓는다** - 가만히 있어야 종이다.
 */
const GRAIN = (() => {
    const rand = makeRandom(4242);
    return Array.from({ length: 520 }, () => ({
        x: rand() * 100,
        y: rand() * 100,
        r: 0.14 + rand() * 0.22,
        o: 0.02 + rand() * 0.025,
    }));
})();

export function PaperGrain({ color = '#3B3B3B' }: { color?: string }) {
    const dots = useMemo(() => GRAIN, []);

    return (
        <Svg
            style={StyleSheet.absoluteFill}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            pointerEvents="none"
        >
            {dots.map((dot, index) => (
                <Circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={color} fillOpacity={dot.o} />
            ))}
        </Svg>
    );
}
