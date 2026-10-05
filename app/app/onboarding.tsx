import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import bottomArt from '@assets/images/bottom.png';
import Dots from '@assets/figma/onboarding-dots.svg';
import { markOnboardingDone } from '@/shared/lib/onboarding';
import { NotebookLines } from '@/features/onboarding/ui/NotebookLines';
import { OnboardingHero } from '@/features/onboarding/ui/OnboardingHero';
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
      {/* 바닥을 가로지르는 손그림 띠. 원본이 정사각이라 그대로 두면 화면 절반을 먹는다.
          높이 230 으로 자르고 그 안에서 그림을 바닥에 붙인다.
          page 안에 두면 좌우 padding(45) 만큼 밀리므로 배경 레이어로 올린다 */}
      <View style={styles.bottomArt} pointerEvents="none">
        <Image
          source={bottomArt}
          style={styles.bottomArtImage}
          resizeMode="stretch"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <View
        style={[
          styles.page,
          { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] },
        ]}
      >
        <View style={styles.hero}>
          <NotebookLines />
          {/* 시안의 `jelly-bowl`(꽃잎 + 젤리) 대신 손그림 로고를 쓴다.
              의도된 시안 이탈이다 - docs/screen/01-onboarding.md 8장 */}
          <OnboardingHero />
        </View>

        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
            {/* 중첩 Text의 배경색이 형광펜 띠가 된다. HTML의 .hl 과 같은 자리 */}
            <Text style={{ backgroundColor: colors.highlight, color: colors.highlightText }}>오늘의 기분</Text>을{'\n'}
            나만의 <Text style={{ backgroundColor: colors.highlight, color: colors.highlightText }}>그림일기</Text>로
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            한 줄만 적으면 AI가 기분을 읽고{'\n'}그날의 그림일기를 만들어 줍니다.
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
    justifyContent: 'flex-start',
    /* HTML 프로토타입 .onb 의 gap:24 와 같은 값 */
    gap: space[6],
  },
  /**
   * 히어로는 좌우 여백(45)을 무시하고 화면 폭을 다 쓴다. 그림이 그보다 넓어도
   * 가장자리가 투명 여백이라 잘려 보이지 않는다.
   * flex를 주지 않는 것이 중요하다 - 남는 공간을 히어로가 다 먹으면 글이 바닥에 붙는다.
   * 남는 공간은 auto 마진 둘(여기와 footer)이 반씩 나눠 먹는다: 그림 위와 글 아래.
   * 그림과 글 사이에는 gap만 남아 글이 그림 바로 밑에 붙는다.
   */
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -45,
    marginTop: 'auto',
    /* footer 의 marginBottom 과 짝. 푸터를 올릴 때 그림이 따라 올라가는 것을 상쇄한다 */
    paddingTop: space[8],
  },
  /** 버튼 윗변까지만 보이게 자르는 창. HTML 의 .bottom-art 와 같은 높이 */
  bottomArt: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, overflow: 'hidden' },
  /** 원본이 정사각이라 가로폭만큼 높이가 잡힌다. 창보다 크고 바닥에 붙는다 */
  bottomArtImage: { position: 'absolute', left: 0, right: 0, bottom: 0, aspectRatio: 1 },
  copy: { gap: space[5] },
  headline: {
    fontSize: font.display,
    lineHeight: leading(font.display, 1.45),
    fontFamily: font.black,
  },
  sub: { fontSize: font.md, fontFamily: font.regular, lineHeight: leading(font.md, 1.6) },
  footer: { alignItems: 'center', gap: space[4], marginTop: 'auto', marginBottom: space[8] },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: space[4] },
  linkLabel: { fontSize: font.base, fontFamily: font.medium },
});
