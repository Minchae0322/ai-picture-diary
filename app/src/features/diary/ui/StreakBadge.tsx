import { Chip } from '@/shared/ui/Chip';
import { useWeatherColors } from '@/shared/theme/useColors';

/**
 * 02 "14일 연속". prototype 은 이것을 **칩 하나**로 둔다 - 맑음 색 점이 붙은 칩이라
 * 찬 브랜드색 배지보다 눈에 덜 띄고, 그 자리의 주인공은 인사말이다.
 *
 * 0일이면 배지 자체를 숨긴다(02 화면 문서 5장).
 */
export function StreakBadge({ days }: { days: number }) {
  const weatherColors = useWeatherColors();
  if (days <= 0) {
    return null;
  }
  return <Chip label={`${days}일 연속`} dot={weatherColors.SUNNY} accessibilityLabel={`연속 기록 ${days}일`} />;
}
