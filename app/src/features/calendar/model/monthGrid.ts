/** 주 시작 요일은 일요일 고정(시안 기준, docs/screen/05-calendar.md 4장) */
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type MonthCell = {
  /** 이 달의 날짜. 앞뒤 빈 칸이면 null */
  day: number | null;
  /** 'YYYY-MM-DD'. 빈 칸이면 null */
  date: string | null;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** 'YYYY-MM' 한 달을 7열 격자로 편다. 앞뒤 빈 칸은 null */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const lead = first.getDay();

  const cells: MonthCell[] = [];
  for (let i = 0; i < lead; i += 1) {
    cells.push({ day: null, date: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, date: toIsoDate(year, month, day) });
  }
  // 마지막 줄을 7칸으로 채워 격자가 어긋나지 않게 한다
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, date: null });
  }
  return cells;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: ((zeroBased % 12) + 12) % 12 + 1,
  };
}
