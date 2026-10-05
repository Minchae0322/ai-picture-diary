import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { formatShortDate, formatScore } from '@/shared/format';
import { MOOD_MAX, MOOD_MIN } from '../api/diaryTypes';

/** prototype `chart()` 와 같은 값: 본문 160 + 축 폭 26, 가로 눈금 5줄 */
const HEIGHT = 160;
const AXIS_WIDTH = 26;
const GRID_LINES = 5;
/** 눈금 글자는 세 개만 둔다. 네 번째(-3)는 아래 그리드선과 붙어 읽기 어렵다 */
const TICKS = [3, 1, -1];

type Point = { date: string; moodScore: number };

/**
 * 06 추이 차트(prototype `chart()`). 무기록일에서 선을 끊는다 - 0으로 이으면
 * "보통이었다"는 거짓이 된다(06 화면 문서 4장).
 *
 * 눈금 글자는 **오른쪽**에 둔다. 왼쪽에 두면 1월 점이 글자에 가린다.
 * 색으로만 뜻을 전하지 않도록 차트 아래에 텍스트 요약을 함께 둔다(dataviz).
 */
export function MoodChart({ points, from, to }: { points: Point[]; from: string; to: string }) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const span = Math.max(dayDiff(from, to), 1);
  const plot = Math.max(width - AXIS_WIDTH, 0);

  const toX = (date: string) => (dayDiff(from, date) / span) * plot;
  const toY = (score: number) => HEIGHT - ((score - MOOD_MIN) / (MOOD_MAX - MOOD_MIN)) * HEIGHT;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT + space[4]} accessibilityLabel="기분 점수 추이">
          {Array.from({ length: GRID_LINES }, (_, index) => {
            const y = (HEIGHT / (GRID_LINES - 1)) * index + space[2];
            return (
              <Line
                key={index}
                x1={0}
                y1={y}
                x2={plot}
                y2={y}
                stroke={colors.track}
                strokeWidth={1}
              />
            );
          })}

          {segments(points).map((segment, index) => (
            <Polyline
              key={index}
              points={segment
                .map((point) => `${toX(point.date)},${toY(point.moodScore) + space[2]}`)
                .join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {points.map((point) => (
            <Circle
              key={point.date}
              cx={toX(point.date)}
              cy={toY(point.moodScore) + space[2]}
              r={4.5}
              fill={colors.primary}
              stroke={colors.surfaceSolid}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT + space[4] }} />
      )}

      <View style={styles.axis} pointerEvents="none">
        {TICKS.map((score) => (
          <Text
            key={score}
            style={[styles.axisLabel, { color: colors.textSubtle, top: toY(score) }]}
          >
            {formatScore(score)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** 하루라도 비면 새 구간이 된다. 각 구간이 폴리라인 하나가 된다. */
function segments(points: Point[]): Point[][] {
  return points.reduce<Point[][]>((acc, point) => {
    const current = acc.at(-1);
    const previous = current?.at(-1);
    if (current && previous && dayDiff(previous.date, point.date) === 1) {
      current.push(point);
    } else {
      acc.push([point]);
    }
    return acc;
  }, []);
}

function dayDiff(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000,
  );
}

/** 차트 옆 텍스트 요약. 시각 정보에 접근할 수 없을 때도 같은 내용을 얻는다(06 화면 문서 5장). */
export function MoodChartSummary({ points }: { points: Point[] }) {
  const colors = useColors();
  if (points.length === 0) {
    return null;
  }
  const best = points.reduce((a, b) => (b.moodScore > a.moodScore ? b : a));
  const worst = points.reduce((a, b) => (b.moodScore < a.moodScore ? b : a));

  return (
    <Text style={[styles.summary, { color: colors.textSubtle }]}>
      가장 높은 날 {formatShortDate(best.date)} {formatScore(best.moodScore)} · 가장 낮은 날{' '}
      {formatShortDate(worst.date)} {formatScore(worst.moodScore)} · 기록이 없는 날은 선을 끊어요
    </Text>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', top: 0, right: 0, width: AXIS_WIDTH },
  axisLabel: {
    position: 'absolute',
    right: 0,
    marginTop: -2,
    width: AXIS_WIDTH,
    textAlign: 'right',
    fontSize: font.xs,
    fontFamily: font.regular,
  },
  summary: { fontSize: font.xs, fontFamily: font.regular, marginTop: space[2] },
});
