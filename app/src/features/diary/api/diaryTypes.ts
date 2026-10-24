/** 서버 명세(docs/api/)에서 한 번만 정의한다. */
export {
  EMOTIONS,
  EMOTION_IMAGE,
  EMOTION_LABEL,
  toEmotion,
  emotionLabel,
  type Emotion,
} from '@/shared/emotion';

import { EMOTIONS, type Emotion } from '@/shared/emotion';

export type DiaryStatus = 'GENERATING' | 'DONE' | 'FAILED';

export type DiaryDetail = {
  id: string;
  entryDate: string;      // ISO date. 표시 직전에 변환한다
  content: string;
  status: DiaryStatus;
  emotion: Emotion | null;
  moodScore: number | null;
  aiComment: string | null;
  imageUrl: string | null;
  canRegenerate: boolean;
};

export type DiarySummary = {
  id: string;
  entryDate: string;
  emotion: Emotion | null;
  content: string;
};

export type DiaryCreated = { id: string; status: DiaryStatus };

/** 05 감정 캘린더. days 에는 기록이 있는 날만 들어온다. */
export type DiaryCalendar = {
  month: string;          // "2026-08"
  days: { date: string; diaryId: string; emotion: Emotion; moodScore: number | null }[];
  summary: { emotion: Emotion; days: number }[];
  recordedDays: number;
};

/** 06 감정 그래프. 무기록일은 points 에 없다 - 선을 끊으라는 뜻이다. */
export type DiaryStats = {
  period: StatsPeriod;
  from: string;
  to: string;
  points: { date: string; moodScore: number }[];
  average: number | null;
  previousAverage: number | null;
  bestDate: string | null;
  bestScore: number | null;
  streakDays: number;
  recordedDays: number;
  words: { word: string; count: number }[];
};

export type StatsPeriod = 'WEEK' | 'MONTH' | 'YEAR';

/** 02 연속 배지 · 06 KPI · 10 통계가 같이 쓰는 값. */
export type DiaryOverview = { totalCount: number; streakDays: number };

/** 기분 점수 범위. 서버 app.diary.mood-min/max 와 같은 값이어야 한다(06 Y축). */
export const MOOD_MIN = -3;
export const MOOD_MAX = 3;

/**
 * 본문 길이 상한. 서버 app.diary.max-content-length 와 같은 값이어야 한다(02 입력).
 * 500 에서 200 으로 내렸다 - ADR 2026-10-20 기분-선택-필수와-본문-200자.
 */
export const MAX_CONTENT_LENGTH = 200;

/**
 * 다시 그리기 하루 상한. 서버 app.diary.daily-regenerate-limit 와 같은 값이어야 한다(04 안내 문구).
 * **남은 횟수는 서버만 안다** - 앱은 `canRegenerate` 만 받으므로 "N번 남았어요"는 쓰지 않는다.
 */
export const DAILY_REGENERATE_LIMIT = 3;

/**
 * 02 오늘의 기분. 아홉 종을 다 두고 가로로 민다 - 넷만 두면 나머지를 고를 길이 없다.
 *
 * **고르는 것은 필수다**(ADR 2026-10-20). 그래도 AI 판정을 대체하지는 않는다 -
 * 결과 화면의 감정은 서버가 정한 `DiaryDetail.emotion` 이고 고른 값과 다를 수 있다.
 */
export const QUICK_EMOTIONS: Emotion[] = EMOTIONS;

/**
 * 02 그림체. **선택이다** - 고르지 않아도 첫 값으로 그린다.
 *
 * <p>값은 서버 프로필의 `aiStyle`(자유 문자열 40자)에 그대로 들어간다. 고정 enum 으로 만들지 않은
 * 이유는 그림체가 모델을 바꾸면 같이 바뀔 말이라 DB 제약으로 굳히면 모델 교체가 마이그레이션이
 * 되기 때문이다. 대신 **고를 수 있는 것은 앱이 정한 이 목록뿐**이라 자유 입력은 생기지 않는다.
 */
export const DRAW_STYLES = [
  { value: 'crayon', label: '크레파스' },
  { value: 'watercolor', label: '수채화' },
  { value: 'pencil', label: '연필' },
  { value: 'pastel', label: '파스텔' },
] as const;

export type DrawStyle = (typeof DRAW_STYLES)[number]['value'];

/** 코드 -> 보이는 이름. 견본 설명문이 쓴다 */
export const DRAW_STYLE_LABEL: Record<DrawStyle, string> = Object.fromEntries(
  DRAW_STYLES.map((item) => [item.value, item.label]),
) as Record<DrawStyle, string>;
