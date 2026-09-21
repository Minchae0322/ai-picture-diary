import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diaryApi } from '../api/diaryApi';
import type { Weather } from '../api/diaryTypes';

/** 키 팩토리. 넓은 것 -> 좁은 것(frontend-state 2장) */
export const diaryKeys = {
  all: ['diary'] as const,
  today: () => [...diaryKeys.all, 'today'] as const,
  recent: (size: number) => [...diaryKeys.all, 'recent', size] as const,
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

export function useRecentDiaries(size = 3) {
  return useQuery({
    queryKey: diaryKeys.recent(size),
    queryFn: ({ signal }) => diaryApi.recent(size, signal),
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
