import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/shared/ui/Chip';
import { space } from '@/shared/theme/tokens';
import { useWeatherColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL, type Weather } from '@/shared/weather';
import type { PostSort } from '../api/communityApi';

const SORTS: { value: PostSort; label: string }[] = [
  { value: 'RECOMMENDED', label: '추천' },
  { value: 'POPULAR', label: '인기' },
  { value: 'LATEST', label: '최신' },
];

/** 시안의 필터 칩. 축이 둘이라 정렬 1개 + 날씨 다중으로 나눠 받는다(08 화면 문서 4장). */
const FILTERABLE: Weather[] = ['SUNNY', 'RAIN'];

type Props = {
  sort: PostSort;
  weathers: Weather[];
  onChangeSort: (sort: PostSort) => void;
  onToggleWeather: (weather: Weather) => void;
};

/** 정렬 칩에는 점이 없고 날씨 칩에만 색점이 붙는다 - 두 축을 모양으로 구분한다 */
export function FeedFilters({ sort, weathers, onChangeSort, onToggleWeather }: Props) {
  const weatherColors = useWeatherColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {SORTS.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={sort === option.value}
          onPress={() => onChangeSort(option.value)}
          accessibilityLabel={
            option.value === 'RECOMMENDED' ? '추천순으로 보기' : `${option.label}순으로 보기`
          }
        />
      ))}
      {FILTERABLE.map((weather) => (
        <Chip
          key={weather}
          label={WEATHER_LABEL[weather]}
          dot={weatherColors[weather]}
          selected={weathers.includes(weather)}
          onPress={() => onToggleWeather(weather)}
          accessibilityLabel={`${WEATHER_LABEL[weather]} 날씨만 보기`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2], paddingRight: space[5] },
});
