import { MOOD_MAX, MOOD_MIN } from '@/shared/weather';

export type TrendRange = 'week' | 'month' | 'year';

export const RANGE_OPTIONS: readonly { value: TrendRange; label: string }[] = [
  { value: 'week', label: '주' },
  { value: 'month', label: '월' },
  { value: 'year', label: '년' },
];

/** 기록이 없는 날은 score가 null이다. 0으로 채우지 않는다 - 0은 "보통"이라는 뜻이 된다 */
export type TrendPoint = { label: string; score: number | null };

export type TrendStats = {
  average: number | null;
  best: TrendPoint | null;
  worst: TrendPoint | null;
  recorded: number;
};

export function summarize(points: TrendPoint[]): TrendStats {
  const recorded = points.filter((point): point is TrendPoint & { score: number } => point.score !== null);
  if (recorded.length === 0) {
    return { average: null, best: null, worst: null, recorded: 0 };
  }
  const total = recorded.reduce((sum, point) => sum + point.score, 0);
  const best = recorded.reduce((top, point) => (point.score > top.score ? point : top));
  const worst = recorded.reduce((low, point) => (point.score < low.score ? point : low));
  return {
    average: Math.round((total / recorded.length) * 10) / 10,
    best,
    worst,
    recorded: recorded.length,
  };
}

/** 점수를 0~1 비율로. 축은 -3 ~ +3 고정이라 데이터에 따라 축이 흔들리지 않는다 */
export function toRatio(score: number): number {
  return (score - MOOD_MIN) / (MOOD_MAX - MOOD_MIN);
}

/** 추이선을 그리려면 최소 몇 개가 필요한가(docs/screen/06-graph.md 5장) */
export const MIN_POINTS_FOR_TREND = 3;
