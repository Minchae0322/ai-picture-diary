import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diaryApi } from '../api/diaryApi';
import type { DiaryStatus, StatsPeriod, Emotion } from '../api/diaryTypes';

/** 키 팩토리. 넓은 것 -> 좁은 것(frontend-state 2장) */
export const diaryKeys = {
  all: ['diary'] as const,
  today: () => [...diaryKeys.all, 'today'] as const,
  detail: (id: string) => [...diaryKeys.all, 'detail', id] as const,
  recent: (size: number) => [...diaryKeys.all, 'recent', size] as const,
  calendar: (month: string) => [...diaryKeys.all, 'calendar', month] as const,
  stats: (period: StatsPeriod) => [...diaryKeys.all, 'stats', period] as const,
  overview: () => [...diaryKeys.all, 'overview'] as const,
};

/**
 * 생성 중 폴링 간격. **1초로 영원히 두드리지 않는다.**
 *
 * <p>늦어질수록 뜸하게 보고, 상한(마지막 칸)을 넘기면 멈춘다 - 무한 폴링은 배터리를 먹고,
 * "상한 없는 대기"는 에러 처리를 안 한 것과 같다(03 화면 규칙). 멈춘 뒤에는 사용자가
 * 03 카드의 "지금 확인하기"나 당겨서 새로 고치기로 직접 묻는다.
 */
const POLL_STEPS = [
  { until: 30_000, every: 1_000 },
  { until: 120_000, every: 3_000 },
  { until: 300_000, every: 10_000 },
] as const;

/** 폴링을 포기하는 시각. 03 카드가 같은 값을 보고 마지막 안내로 넘어간다 */
export const POLL_GIVE_UP_MS = POLL_STEPS[POLL_STEPS.length - 1].until;

/**
 * GENERATING 을 처음 본 시각부터 재서 간격을 고른다.
 *
 * <p>서버가 생성 시작 시각을 주지 않으므로 **앱이 처음 본 시각**이 기준이다. 화면을 떠났다
 * 돌아오면 다시 0 부터 센다 - 늦어진 것을 과소평가할 뿐 거짓을 말하지는 않는다.
 */
function useGeneratingPoll() {
  const since = useRef<number | null>(null);

  return (status: DiaryStatus | undefined): number | false => {
    if (status !== 'GENERATING') {
      since.current = null;
      return false;
    }
    since.current = since.current ?? Date.now();
    const elapsed = Date.now() - since.current;
    return POLL_STEPS.find((step) => elapsed < step.until)?.every ?? false;
  };
}

/** 오늘 기록. GENERATING 인 동안만 폴링한다(03 화면). */
export function useToday() {
  const pollWhileGenerating = useGeneratingPoll();

  return useQuery({
    queryKey: diaryKeys.today(),
    queryFn: ({ signal }) => diaryApi.today(signal),
    staleTime: 30_000,
    refetchInterval: (query) => pollWhileGenerating(query.state.data?.status),
  });
}

/** 04 과거 날짜 상세. 05 캘린더에서 들어온다. */
export function useDiaryDetail(id: string) {
  const pollWhileGenerating = useGeneratingPoll();

  return useQuery({
    queryKey: diaryKeys.detail(id),
    queryFn: ({ signal }) => diaryApi.detail(id, signal),
    staleTime: 60_000,
    refetchInterval: (query) => pollWhileGenerating(query.state.data?.status),
  });
}

export function useRecentDiaries(size = 3) {
  return useQuery({
    queryKey: diaryKeys.recent(size),
    queryFn: ({ signal }) => diaryApi.recent(size, signal),
    staleTime: 60_000,
  });
}

/** 05. 월을 넘길 때 이전 달 데이터를 유지한 채 교체한다 - 그리드가 깜빡이지 않는다. */
export function useCalendar(month: string) {
  return useQuery({
    queryKey: diaryKeys.calendar(month),
    queryFn: ({ signal }) => diaryApi.calendar(month, signal),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useStats(period: StatsPeriod) {
  return useQuery({
    queryKey: diaryKeys.stats(period),
    queryFn: ({ signal }) => diaryApi.stats(period, signal),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useOverview() {
  return useQuery({
    queryKey: diaryKeys.overview(),
    queryFn: ({ signal }) => diaryApi.overview(signal),
    staleTime: 60_000,
  });
}

export function useWriteDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, userHint }: { content: string; userHint: Emotion }) =>
      diaryApi.write(content, userHint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diaryKeys.all });
    },
  });
}

export function useRegenerateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diaryApi.regenerate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diaryKeys.all });
    },
  });
}
