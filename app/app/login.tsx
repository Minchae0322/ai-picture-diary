import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { completeOnboarding } from '@/features/onboarding/useOnboarding';
import {
  buttonHeight,
  CONTENT_MAX_WIDTH,
  font,
  leading,
  MIN_TOUCH_TARGET,
  radius,
  space,
} from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Icon } from '@/shared/ui/Icon';

/**
 * 11 로그인. 01 온보딩의 "이미 계정이 있어요"에서 들어온다.
 *
 * **인증이 아직 없다**(spring-auth 미정, docs/screen/11-login.md 7장).
 * 어느 버튼을 눌러도 홈으로 보내고 그 사실을 알린다 - 되는 척하지 않는다.
 *
 * <p>소셜 버튼의 색과 마크는 **임시다.** 애플은 공식 버튼 규정(지정 로고·문구·최소 높이 44pt·
 * 허용 색)을 벗어나면 심사에서 걸리고, 구글도 공식 4색 G 마크와 지정 색을 요구한다.
 * 배포 전에 `expo-apple-authentication` 의 기본 버튼과 구글 공식 에셋으로 바꾼다.
 */

/** 애플 규정색. 테마를 따라 바뀌면 안 되므로 토큰으로 두지 않는다 */
const APPLE_BG = '#000000';
const APPLE_FG = '#ffffff';
/** 구글 규정색(라이트 버튼) */
const GOOGLE_BG = '#ffffff';
const GOOGLE_FG = '#1f1f1f';
const GOOGLE_BORDER = '#dadce0';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /** 인증이 붙기 전까지는 어디로 눌러도 홈이다 */
  const soon = (label: string) => () => {
    Alert.alert(label, '인증이 아직 붙지 않았어요. 지금은 홈으로 이동합니다.', [
      {
        text: '확인',
        onPress: async () => {
          await completeOnboarding();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[6] },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          hitSlop={space[2]}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.backGlyph, { color: colors.text }]}>←</Text>
        </Pressable>

        <View style={styles.head}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            다시 만나서{'\n'}반가워요
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            그동안의 기록은 그대로 기다리고 있어요.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={soon('Apple로 로그인')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.social,
              { backgroundColor: APPLE_BG, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Icon name="apple" size={18} color={APPLE_FG} />
            <Text style={[styles.socialLabel, { color: APPLE_FG }]}>Apple로 로그인</Text>
          </Pressable>

          <Pressable
            onPress={soon('Google로 로그인')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.social,
              styles.socialOutlined,
              { backgroundColor: GOOGLE_BG, borderColor: GOOGLE_BORDER, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {/* 구글 마크는 네 가지 색이 규정이라 color 를 무시한다 */}
            <Icon name="google" size={18} color={GOOGLE_FG} />
            <Text style={[styles.socialLabel, { color: GOOGLE_FG }]}>Google로 로그인</Text>
          </Pressable>

          <View style={styles.or}>
            <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
            <Text style={[styles.orLabel, { color: colors.textMuted }]}>또는</Text>
            <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
          </View>

          <Pressable
            onPress={soon('회원가입')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.social,
              styles.socialOutlined,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.socialLabel, { color: colors.primary }]}>회원가입</Text>
          </Pressable>

          <Text style={[styles.terms, { color: colors.textSubtle }]}>
            계속하면 이용약관과 개인정보처리방침에{'\n'}동의하는 것으로 봅니다.
          </Text>
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
    paddingHorizontal: space[6],
    gap: space[5],
  },
  back: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignSelf: 'flex-start' },
  backGlyph: { fontSize: font.lg, fontFamily: font.regular },
  head: { gap: space[1] },
  title: { fontSize: font.xxl, lineHeight: leading(font.xxl, 1.35), fontFamily: font.black },
  sub: { fontSize: font.base, fontFamily: font.regular, lineHeight: leading(font.base) },
  /** 버튼은 바닥에 모은다. 위쪽 글은 제자리에 두고 남는 공간을 여기서 먹는다 */
  actions: { marginTop: 'auto', gap: space[2] },
  social: {
    height: buttonHeight.xlarge,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  socialOutlined: { borderWidth: 1.5 },
  socialLabel: { fontSize: font.md, fontFamily: font.bold },
  or: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginVertical: space[1] },
  rule: { flex: 1, height: 1 },
  orLabel: { fontSize: font.xs, fontFamily: font.regular },
  terms: {
    marginTop: space[1],
    fontSize: font.micro,
    fontFamily: font.regular,
    lineHeight: leading(font.micro, 1.5),
    textAlign: 'center',
  },
});
