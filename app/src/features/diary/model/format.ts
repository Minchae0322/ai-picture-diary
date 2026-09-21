const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 02 헤더: "2026년 8월 24일 월요일" */
export function formatLongDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEK[date.getDay()]}요일`;
}

/** 04 헤더: "2026.08.24". ISO 날짜 문자열을 그대로 자른다(타임존을 다시 계산하지 않는다) */
export function formatDotDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${year}.${month}.${day}`;
}

/** 02 최근 기록: "8/23" */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number(month)}/${Number(day)}`;
}
