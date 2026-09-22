/** 표시용 변환은 화면 직전에만. 서버에서 온 ISO 문자열을 그대로 들고 다닌다. */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatFullDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

/** "2026-08-24" -> "2026.08.24" (04 헤더) */
export function formatDotDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

/** "2026-08-24" -> "8/24" (02 최근 기록, 06 최고의 날) */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number(month)}/${Number(day)}`;
}

/** "2026-08" -> "2026년 8월" (05 월 이동) */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  return `${year}년 ${Number(m)}월`;
}

/** 08 피드의 "2시간 전". 하루가 넘으면 날짜로 바꾼다 - "27시간 전"은 읽기 어렵다. */
export function formatRelative(iso: string, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;

  return formatShortDate(iso.slice(0, 10));
}

/** 기분 점수는 부호를 항상 보여준다. +0 은 만들지 않는다. */
export function formatScore(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}

export function formatAverage(average: number | null): string {
  if (average === null) return '-';
  return average > 0 ? `+${average.toFixed(1)}` : average.toFixed(1);
}

/** "21:00:00" -> "오후 9시" (10 리마인더 행) */
export function formatReminder(time: string | null): string {
  if (!time) return '설정 안 함';
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const meridiem = hour < 12 ? '오전' : '오후';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return Number(minuteText) === 0
    ? `매일 ${meridiem} ${display}시`
    : `매일 ${meridiem} ${display}시 ${Number(minuteText)}분`;
}
