import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { font, leading, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { MOOD_MAX, MOOD_MIN, formatMood } from '@/shared/weather';
import { MIN_POINTS_FOR_TREND, toRatio, type TrendPoint, type TrendStats } from '../model/trend';

const HEIGHT = 160;
/** Y축 라벨이 들어갈 오른쪽 여백 */
const AXIS_WIDTH = 26;
/** +3 / +1 / -1. 시안 9:215~9:217 */
const AXIS_TICKS = [3, 1, -1];
const GRID_LINES = 5;

type Props = { points: TrendPoint[]; stats: TrendStats };

/**
 * 06 기분 추이 (시안 9:193).
 * 단일 계열이라 범례를 두지 않는다 - 제목이 계열 이름이다(dataviz 6장).
 * 무기록일은 선을 끊는다. 0으로 채우면 "보통"이라는 거짓말이 된다(docs/screen/06-graph.md 4장).
 */
export function MoodTrendChart({ points, stats }: Props) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(0, width - AXIS_WIDTH);

  if (stats.recorded < MIN_POINTS_FOR_TREND) {
    return (
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        기록이 {MIN_POINTS_FOR_TREND}일 이상 쌓이면 추이를 보여드려요
      </Text>
    );
  }

  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index: number) => index * stepX;
  const y = (score: number) => HEIGHT - toRatio(score) * HEIGHT;

  // 무기록일에서 끊어지는 조각들
  const segments: { index: number; score: number }[][] = [];
  let current: { index: number; score: number }[] = [];
  points.forEach((point, index) => {
    if (point.score === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      return;
    }
    current.push({ index, score: point.score });
  });
  if (current.length > 0) {
    segments.push(current);
  }

  const toPath = (segment: { index: number; score: number }[]) =>
    segment.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.index)},${y(p.score)}`).join(' ');

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={describe(stats)}
      style={styles.wrap}
    >
      {plotWidth <= 0 ? null : (
        <Svg width={width} height={HEIGHT + 14}>
          {/* 그리드는 뒤로 물러나 있어야 한다 */}
          {Array.from({ length: GRID_LINES }, (_, i) => {
            const gy = (HEIGHT / (GRID_LINES - 1)) * i;
            return (
              <Line
                key={`grid-${i}`}
                x1={0}
                y1={gy}
                x2={plotWidth}
                y2={gy}
                stroke={colors.track}
                strokeWidth={1}
              />
            );
          })}

          {segments.map((segment) => (
            <Path
              key={`line-${segment[0].index}`}
              d={toPath(segment)}
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

          {/* 점은 8px 이상. 표면색 링을 둘러 선 위에서 떠 보이게 한다 */}
          {points.map((point, index) =>
            point.score === null ? null : (
              <Circle
                key={`pt-${point.label}`}
                cx={x(index)}
                cy={y(point.score)}
                r={4.5}
                fill={colors.primary}
                stroke={colors.surfaceSolid}
                strokeWidth={2}
              />
            ),
          )}
        </Svg>
      )}

      {/* Y축 라벨. 값 텍스트는 계열색이 아니라 텍스트 토큰을 입는다 */}
      <View style={[styles.axis, { width: AXIS_WIDTH }]} pointerEvents="none">
        {AXIS_TICKS.map((tick) => (
          <Text
            key={tick}
            style={[
              styles.tick,
              { color: colors.textSubtle, top: HEIGHT - toRatio(tick) * HEIGHT - 6 },
            ]}
          >
            {formatMood(tick)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** 차트 옆에 텍스트 요약을 반드시 둔다(docs/screen/06-graph.md 5장 접근성) */
function describe(stats: TrendStats): string {
  if (stats.average === null || stats.best === null || stats.worst === null) {
    return '표시할 기록이 없어요';
  }
  return [
    `기분 추이 차트. 축은 ${formatMood(MOOD_MIN)}에서 ${formatMood(MOOD_MAX)}`,
    `기록 ${stats.recorded}일`,
    `평균 ${formatMood(stats.average)}`,
    `가장 높은 날 ${stats.best.label} ${formatMood(stats.best.score as number)}`,
    `가장 낮은 날 ${stats.worst.label} ${formatMood(stats.worst.score as number)}`,
  ].join(', ');
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  axis: { position: 'absolute', right: 0, top: 0, height: HEIGHT },
  tick: { position: 'absolute', right: 0, fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs, 1) },
  empty: { fontSize: font.base, fontFamily: font.regular, lineHeight: leading(font.base), paddingVertical: space[6] },
});
