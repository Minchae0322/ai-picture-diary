import { weatherColor } from '@/shared/theme/tokens';
import { Chip } from '@/shared/ui/Chip';

/** 시안 02 `streak`. 0일이면 배지를 숨긴다(docs/screen/02-home.md 5장) */
export function StreakChip({ days }: { days: number }) {
  if (days <= 0) {
    return null;
  }
  return <Chip label={`${days}일 연속`} dotColor={weatherColor.SUNNY} />;
}
