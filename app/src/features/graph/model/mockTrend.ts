import type { TrendPoint, TrendRange } from './trend';

/**
 * 기분 추이와 자주 쓴 말. **목 데이터다.**
 *
 * 통계 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/stats/mood?range=week|month|year` -> (날짜, 점수) 시계열 + 집계 KPI + 상위 단어.
 * 단어 추출 주체(형태소 분석기/LLM)는 미정이다(docs/screen/06-graph.md 6장).
 *
 * 무기록일을 일부러 섞어 두었다. 선이 끊기는 표현을 확인하기 위해서다.
 */
const MONTH_SCORES: (number | null)[] = [
  1, 2, -1, 0, 2, 3, 1, null, -2, 0, 1, 2, 2, null, 1, 0, -1, 1, 3, 2, 1, null, 0, 1, 2, 2, 1, -1, 0, 1,
];

export function mockTrend(range: TrendRange): TrendPoint[] {
  if (range === 'week') {
    return ['월', '화', '수', '목', '금', '토', '일'].map((label, index) => ({
      label,
      score: MONTH_SCORES[index] ?? null,
    }));
  }
  if (range === 'year') {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((label, index) => ({
      label: `${label}월`,
      score: MONTH_SCORES[index * 2] ?? null,
    }));
  }
  return MONTH_SCORES.map((score, index) => ({ label: `${index + 1}`, score }));
}

export const MOCK_WORDS = ['회의', '산책', '피곤', '맛있다'] as const;

