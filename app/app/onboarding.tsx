import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import bottomArt from '@assets/images/bottom.png';
import { completeOnboarding } from '@/features/onboarding/useOnboarding';
import { NotebookLines } from '@/features/onboarding/ui/NotebookLines';
import { OnboardingHero } from '@/features/onboarding/ui/OnboardingHero';
import { CONTENT_MAX_WIDTH, font, leading, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Button } from '@/shared/ui/Button';

/**
 * 01 온보딩. 탭바 없음.
 *
 * **슬라이드는 한 장이다.** 시안의 dots 는 3개지만 2·3번 내용이 없고, 빈 슬라이드를 지어내지
 * 않기로 했다(docs/screen/01-onboarding.md 7장). dots 는 시안의 자리만 유지하는 장식이라
 * 스크린리더에서 숨긴다 - 넘길 것이 없는데 "3장 중 1장"이라고 읽으면 거짓말이 된다.
 *
 * 시안은 844 고정 높이의 절대 좌표지만, 여기서는 위아래 여백을 늘려 어느 높이에서도
 * 같은 순서로 쌓이게 한다. 남는 공간은 auto 마진 둘(hero 와 footer)이 반씩 나눠 먹는다.
 */
export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const start = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* 바닥을 가로지르는 손그림 띠. 원본이 정사각이라 그대로 두면 화면 절반을 먹는다.
          높이 230 으로 자르고 그 안에서 그림을 바닥에 붙인다.
          page 안에 두면 좌우 padding(45) 만큼 밀리므로 배경 레이어로 올린다 */}
      <View style={styles.bottomArt} pointerEvents="none">
        <Image
          source={bottomArt}
          style={styles.bottomArtImage}
          resizeMode="stretch"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
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
            {/* 중첩 Text 의 배경색이 형광펜 띠가 된다. 글자색이 배경 바닐라와 같아
                글자가 파인 것처럼 보인다. 띠가 획을 다 덮어야 한다 - 띠 밖으로 나간 획은 사라진다.
                RN 은 띠 높이를 줄 높이에서 떼어낼 수단이 없어 웹 프로토타입보다 띠가 두껍다
                (docs/screen/01-onboarding.md 8장의 의도된 차이) */}
            <Text style={{ backgroundColor: colors.highlight, color: colors.highlightText }}>
              오늘의 기분
            </Text>
            을{'\n'}나만의{' '}
            <Text style={{ backgroundColor: colors.highlight, color: colors.highlightText }}>
              그림일기
            </Text>
            로
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            한 줄만 적으면 AI가 기분을 읽고{'\n'}그날의 그림일기를 만들어 줍니다.
          </Text>
        </View>

        <View style={styles.footer}>
          {/* footer 가 alignItems:center 라 버튼이 폭을 못 채운다. 이 래퍼가 블록 폭을 만든다 */}
          <View style={styles.cta}>
            <Button label="무료로 시작하기" size="xlarge" onPress={start} />
          </View>

          {/* 로그인 화면은 아직 없다(docs/screen/01-onboarding.md 7장).
              뒤 띠의 가는 갈색 선이 글자를 끊어 대비가 떨어지는 자리다 - 같은 문서 8장에 미해결로 적어뒀다 */}
          <Pressable
            onPress={start}
            accessibilityRole="link"
            accessibilityHint="로그인 화면이 아직 없어 홈으로 이동합니다"
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>이미 계정이 있어요</Text>
          </Pressable>

          <View
            style={styles.dots}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {[0, 1, 2].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.dot,
                  {
                    width: dot === 0 ? 22 : 8,
                    backgroundColor: dot === 0 ? colors.primary : colors.decor,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 45,
    justifyContent: 'flex-start',
    /* 웹 프로토타입 .onb 의 gap:24 와 같은 값 */
    gap: space[6],
  },
  /**
   * 히어로는 좌우 여백(45)을 무시하고 화면 폭을 다 쓴다. 그림이 그보다 넓어도
   * 가장자리가 투명 여백이라 잘려 보이지 않는다.
   * flex 를 주지 않는 것이 중요하다 - 남는 공간을 히어로가 다 먹으면 글이 바닥에 붙는다.
   */
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -45,
    marginTop: 'auto',
    /* footer 의 marginBottom 과 짝. 푸터를 올릴 때 그림이 따라 올라가는 것을 상쇄한다 */
    paddingTop: space[8],
  },
  /** 버튼 윗변까지만 보이게 자르는 창. 웹의 .bottom-art 와 같은 높이 */
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
  cta: { alignSelf: 'stretch' },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: space[4] },
  linkLabel: { fontSize: font.base, fontFamily: font.medium },
  dots: { flexDirection: 'row', gap: space[2] },
  dot: { height: 8, borderRadius: radius.full },
});
