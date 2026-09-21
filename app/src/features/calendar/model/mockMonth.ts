import type { Weather } from '@/shared/weather';
import { WEATHERS } from '@/shared/weather';
import { toIsoDate } from './monthGrid';

/**
 * 한 달치 날씨. **목 데이터다.**
 *
 * 캘린더 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/diaries/calendar?month=YYYY-MM` -> 날짜별 (weather, diaryId) + 월 집계.
 * 집계는 서버가 계산해 내려준다. 여기서 클라이언트가 세는 것은 대역이기 때문이다
 * (docs/screen/05-calendar.md 6장 "클라이언트 재계산 금지").
 */
export type MonthEntry = { date: string; weather: Weather; diaryId: string };

/** 날짜를 섞어 매번 같은 모양이 나오게 한다. 난수를 쓰면 리렌더마다 달라진다 */
const pick = (seed: number): Weather => WEATHERS[(seed * 7 + 3) % WEATHERS.length];

export function mockMonthEntries(year: number, month: number): MonthEntry[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const entries: MonthEntry[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    // 대략 4일에 3일꼴로 기록이 있는 달을 만든다. 무기록일이 있어야 빈 칸 표현을 볼 수 있다
    if ((day + month) % 4 === 0) {
      continue;
    }
    entries.push({
      date: toIsoDate(year, month, day),
      weather: pick(day + month),
      diaryId: `mock-${year}${month}${day}`,
    });
  }
  return entries;
}

/** 월 요약. 서버가 주는 값을 흉내 낸다 */
export function mockMonthSummary(entries: MonthEntry[]): { weather: Weather; days: number }[] {
  const counted = new Map<Weather, number>();
  for (const entry of entries) {
    counted.set(entry.weather, (counted.get(entry.weather) ?? 0) + 1);
  }
  return [...counted.entries()]
    .map(([weather, days]) => ({ weather, days }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 4);
}
