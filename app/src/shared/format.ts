/** 표시용 변환은 화면 직전에만. 서버에서 온 ISO 문자열을 그대로 들고 다닌다. */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatFullDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

/**
 * "10월 24일 토요일" (02/03/04 홈 머리글).
 *
 * <p>연도를 떼는 이유는 두 가지다. 오늘 화면에서 연도는 아는 값이고, 머리글 한 줄에 연속 기록 칩이
 * 같이 앉아야 해서 "2026년"이 들어가면 390 폭에서 칩이 밀린다.
 */
export function formatTodayHeadline(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

/**
 * 학습지의 "년 월 일" 빈칸을 채우는 형식(02 그림일기 종이).
 * 숫자와 단위를 따로 돌려주는 이유는 **단위가 인쇄된 글자이고 숫자가 채워 넣은 값**이라
 * 둘의 굵기와 색이 달라야 하기 때문이다 - 한 문자열로 합치면 그 구분이 사라진다.
 */
export function splitTodayParts(date: Date): Array<{ value: string; unit: string }> {
  return [
    { value: String(date.getFullYear()), unit: '년' },
    { value: String(date.getMonth() + 1), unit: '월' },
    { value: String(date.getDate()), unit: '일' },
    { value: WEEKDAYS[date.getDay()], unit: '요일' },
  ];
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
