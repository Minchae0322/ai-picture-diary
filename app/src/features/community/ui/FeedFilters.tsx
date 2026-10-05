import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/shared/ui/Chip';
import { space } from '@/shared/theme/tokens';
import { EMOTION_LABEL, type Emotion } from '@/shared/emotion';
import type { PostSort } from '../api/communityApi';

const SORTS: { value: PostSort; label: string }[] = [
  { value: 'RECOMMENDED', label: '추천' },
  { value: 'LATEST', label: '최신' },
  { value: 'POPULAR', label: '인기' },
];

/** 시안의 필터 칩. 축이 둘이라 정렬 1개 + 감정 다중으로 나눠 받는다(08 화면 문서 4장). */
const FILTERABLE: Emotion[] = ['HAPPY', 'SAD'];

type Props = {
  sort: PostSort;
  emotions: Emotion[];
  onChangeSort: (sort: PostSort) => void;
  onToggleEmotion: (emotion: Emotion) => void;
};

export function FeedFilters({ sort, emotions, onChangeSort, onToggleEmotion }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SORTS.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={sort === option.value}
          onPress={() => onChangeSort(option.value)}
          accessibilityLabel={option.value === 'RECOMMENDED' ? '추천순으로 보기' : `${option.label}순으로 보기`}
        />
      ))}
      {FILTERABLE.map((emotion) => (
        <Chip
          key={emotion}
          label={EMOTION_LABEL[emotion]}
          selected={emotions.includes(emotion)}
          onPress={() => onToggleEmotion(emotion)}
          accessibilityLabel={`${EMOTION_LABEL[emotion]} 기록만 보기`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2], paddingRight: space[4] },
});
