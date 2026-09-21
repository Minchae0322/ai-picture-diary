/**
 * 누적 지표. **목 데이터다.**
 *
 * 연속 기록·뱃지 집계 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/stats/me`.
 *
 * **02·04·06·10이 같은 값을 써야 한다.** 그래서 feature가 아니라 shared에 둔다.
 * 서버가 붙을 때도 계산 위치는 한 곳으로 고정한다(docs/screen/06-graph.md 6장).
 */
export const MOCK_STATS = {
  streakDays: 14,
  totalDiaries: 142,
  badgesOwned: 12,
  badgesTotal: 40,
} as const;
