import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { completeOnboarding } from '@/features/onboarding/useOnboarding';

/**
 * 01 온보딩. 시안에는 dots 가 3개인데 2·3번 슬라이드 내용이 없다(01 화면 문서 7장).
 * 빈 슬라이드를 지어내지 않고 제품이 실제로 약속하는 세 가지를 적었다. CTA 는 모든 슬라이드에 노출한다.
 */
const SLIDES = [
  {
    art: 'candy' as const,
    title: '오늘의 기분을\n날씨로 그려드릴게요',
    body: '한 줄만 적으면 AI가 감정을 읽어 그림으로 그려줘요.',
  },
  {
    art: 'calendar' as const,
    title: '쌓인 날씨가\n한 달이 됩니다',
    body: '캘린더와 그래프로 내 기분의 흐름이 보여요.',
  },
  {
    art: 'medal' as const,
    title: '이어서 기록하면\n젤리 뱃지를 받아요',
    body: '연속 기록이 끊기지 않게 조용히 응원할게요.',
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;

  const start = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingBottom: insets.bottom + space[6] }]}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.glow, { backgroundColor: colors.primary }]}
      />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ marginTop: insets.top }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={[styles.bowl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name={slide.art} size={96} color={colors.primary} />
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {slide.title}
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots} accessibilityLabel={`${SLIDES.length}장 중 ${index + 1}장`}>
        {SLIDES.map((slide, dot) => (
          <View
            key={slide.title}
            style={[
              styles.dot,
              {
                width: dot === index ? 22 : 8,
                backgroundColor: dot === index ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="무료로 시작하기" size="xlarge" onPress={start} />
        <Pressable
          onPress={start}
          accessibilityRole="button"
          accessibilityHint="로그인 화면은 아직 준비 중이라 바로 시작합니다"
          style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.textMuted, fontSize: font.sm }}>이미 계정이 있어요</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between' },
  glow: {
    position: 'absolute',
    top: -160,
    right: -140,
    width: 420,
    height: 420,
    borderRadius: radius.full,
    opacity: 0.1,
  },
  slide: { alignItems: 'center', justifyContent: 'center', gap: space[4], paddingHorizontal: space[6] },
  bowl: {
    width: 220,
    height: 220,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font.xl, fontWeight: font.weightBold, textAlign: 'center', lineHeight: 34 },
  body: { fontSize: font.sm, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space[2] },
  dot: { height: 8, borderRadius: radius.full },
  actions: { paddingHorizontal: space[6], gap: space[2] },
  link: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
});
