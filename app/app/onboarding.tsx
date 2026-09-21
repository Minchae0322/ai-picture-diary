import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dots from '@assets/figma/onboarding-dots.svg';
import { markOnboardingDone } from '@/shared/lib/onboarding';
import { CloudHero } from '@/features/onboarding/ui/CloudHero';
import { CONTENT_MAX_WIDTH, font, leading, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Button } from '@/shared/ui/Button';
import { ScreenBackground } from '@/shared/ui/Screen';

/**
 * 01 온보딩. 시안 8:2. 탭바 없음.
 * 시안은 844 고정 높이의 절대 좌표지만, 여기서는 위아래 여백을 늘려 어느 높이에서도 같은 순서로 쌓이게 한다.
 */
export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const start = () => {
    void markOnboardingDone();
    router.replace('/');
  };

  return (
    <ScreenBackground>
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] },
        ]}
      >
        <View style={styles.hero}>
          {/* 시안의 `jelly-bowl`(꽃잎 + 젤리) 대신 둥둥 뜨는 구름으로 바꿨다.
              의도된 시안 이탈이다 - docs/screen/01-onboarding.md 8장 */}
          <CloudHero />
        </View>

        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
            오늘의 기분을{'\n'}날씨로 그려드릴게요
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            한 줄만 적으면 AI가 감정을 읽고{'\n'}그날의 날씨와 그림을 만들어 줍니다.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button label="무료로 시작하기" size="xlarge" width="block" onPress={start} />

          {/* 로그인 화면은 아직 없다(docs/screen/01-onboarding.md 7장) */}
          <Pressable
            onPress={start}
            accessibilityRole="link"
            accessibilityHint="로그인 화면이 아직 없어 홈으로 이동합니다"
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>이미 계정이 있어요</Text>
          </Pressable>

          {/* 슬라이드 2·3은 시안에 없다. 인디케이터는 자리만 유지하고 뜻을 담지 않는다 */}
          <View accessibilityElementsHidden importantForAccessibility="no">
            <Dots />
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 45,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: space[4] },
  headline: {
    fontSize: font.display,
    lineHeight: leading(font.display, 1.35),
    fontWeight: font.weightBlack,
  },
  sub: { fontSize: font.md, lineHeight: leading(font.md) },
  footer: { alignItems: 'center', gap: space[4], paddingTop: space[12] },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: space[4] },
  linkLabel: { fontSize: font.base, fontWeight: font.weightMedium },
});
