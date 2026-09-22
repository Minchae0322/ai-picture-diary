import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diaryApi } from '../api/diaryApi';
import type { StatsPeriod, Weather } from '../api/diaryTypes';

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

const POLL_MS = 1000;

/** 오늘 기록. GENERATING 인 동안만 폴링한다(03 화면). */
export function useToday() {
  return useQuery({
    queryKey: diaryKeys.today(),
    queryFn: ({ signal }) => diaryApi.today(signal),
    staleTime: 30_000,
    refetchInterval: (query) => (query.state.data?.status === 'GENERATING' ? POLL_MS : false),
  });
}

/** 04 과거 날짜 상세. 05 캘린더에서 들어온다. */
export function useDiaryDetail(id: string) {
  return useQuery({
    queryKey: diaryKeys.detail(id),
    queryFn: ({ signal }) => diaryApi.detail(id, signal),
    staleTime: 60_000,
    refetchInterval: (query) => (query.state.data?.status === 'GENERATING' ? POLL_MS : false),
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
    mutationFn: ({ content, userHint }: { content: string; userHint: Weather | null }) =>
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
