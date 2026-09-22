import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { formatShortDate, formatScore } from '@/shared/format';
import { MOOD_MAX, MOOD_MIN } from '../api/diaryTypes';

const HEIGHT = 160;
const AXIS_WIDTH = 28;
const GRID_SCORES = [MOOD_MAX, 1, -1, MOOD_MIN];

type Point = { date: string; moodScore: number };

/**
 * 06 추이 차트. 무기록일에서 선을 끊는다 - 0으로 이으면 "보통이었다"는 거짓이 된다(06 화면 문서 4장).
 * 색으로만 뜻을 전하지 않도록 차트 아래에 텍스트 요약을 함께 둔다(dataviz).
 */
export function MoodChart({ points, from, to }: { points: Point[]; from: string; to: string }) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const span = Math.max(dayDiff(from, to), 1);

  const toX = (date: string) => AXIS_WIDTH + (dayDiff(from, date) / span) * (width - AXIS_WIDTH);
  const toY = (score: number) =>
    HEIGHT - ((score - MOOD_MIN) / (MOOD_MAX - MOOD_MIN)) * (HEIGHT - space[4]) - space[2];

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT} accessibilityLabel="기분 점수 추이">
          {GRID_SCORES.map((score) => (
            <Line
              key={score}
              x1={AXIS_WIDTH}
              y1={toY(score)}
              x2={width}
              y2={toY(score)}
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}

          {segments(points).map((segment, index) => (
            <Polyline
              key={index}
              points={segment.map((point) => `${toX(point.date)},${toY(point.moodScore)}`).join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
            />
          ))}

          {points.map((point) => (
            <Circle
              key={point.date}
              cx={toX(point.date)}
              cy={toY(point.moodScore)}
              r={3.5}
              fill={colors.primary}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}

      <View style={styles.axis} pointerEvents="none">
        {GRID_SCORES.map((score) => (
          <Text
            key={score}
            style={[styles.axisLabel, { color: colors.textSubtle, top: toY(score) - 7 }]}
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
    <Text style={[styles.summary, { color: colors.textMuted }]}>
      가장 높은 날 {formatShortDate(best.date)} {formatScore(best.moodScore)} · 가장 낮은 날{' '}
      {formatShortDate(worst.date)} {formatScore(worst.moodScore)}
    </Text>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  axisLabel: { position: 'absolute', left: 0, fontSize: font.xs, width: AXIS_WIDTH - space[1] },
  summary: { fontSize: font.xs, marginTop: space[2] },
});
