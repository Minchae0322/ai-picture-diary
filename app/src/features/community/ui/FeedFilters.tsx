import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/shared/ui/Chip';
import { space } from '@/shared/theme/tokens';
import { EMOTION_LABEL, type Emotion } from '@/shared/emotion';
import type { PostSort } from '../api/communityApi';

const SORTS: { value: PostSort; label: string }[] = [
  { value: 'RECOMMENDED', label: '추천' },
  { value: 'POPULAR', label: '인기' },
  { value: 'LATEST', label: '최신' },
];

/** 시안의 필터 칩. 축이 둘이라 정렬 1개 + 감정 다중으로 나눠 받는다(08 화면 문서 4장). */
const FILTERABLE: Emotion[] = ['HAPPY', 'SAD'];

type Props = {
  sort: PostSort;
  emotions: Emotion[];
  onChangeSort: (sort: PostSort) => void;
  onToggleEmotion: (emotion: Emotion) => void;
};

/**
 * 정렬 칩과 감정 칩이 한 줄에 섞여 있다. 감정 칩에 색점을 붙여 축을 구분하던 방식은 버렸다 -
 * 과일 색은 뜻을 나르지 않아서(`shared/emotion.ts`) 점이 축 구분이 아니라 오해를 만든다.
 */
export function FeedFilters({ sort, emotions, onChangeSort, onToggleEmotion }: Props) {
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
      {FILTERABLE.map((emotion) => (
        <Chip
          key={emotion}
          label={EMOTION_LABEL[emotion]}
          emotion={emotion}
          selected={emotions.includes(emotion)}
          onPress={() => onToggleEmotion(emotion)}
          accessibilityLabel={`${EMOTION_LABEL[emotion]} 기록만 보기`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2], paddingRight: space[5] },
});
