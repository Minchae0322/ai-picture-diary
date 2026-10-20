import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/ui/Button';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { SketchLine } from '@/shared/ui/SketchLine';
import { Muted, Note } from '@/shared/ui/Type';
import { useToast } from '@/shared/ui/Toast';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { useAccount } from '../AccountProvider';

type Props = {
  /** 무엇을 하려다 막혔는지. "커뮤니티" 처럼 화면 이름을 그대로 넣는다 */
  feature: string;
  /** 왜 계정이 필요한지 한 줄. 기능마다 이유가 다르다 */
  reason: string;
};

/**
 * 로그인 벽(ADR 2026-10-20). 탭은 그대로 열리고 그 위에 올라온다 - 뒤에 무엇이 있는지 보여야
 * 로그인할 이유가 생긴다. 탭을 잠그면 제품이 닫혀 보이고, 로그인 화면으로 밀어내면 맥락이 끊긴다.
 *
 * <p>**"그냥 둘러보기"는 인증이 붙는 날 지울 임시 통로다.** 지금은 통과할 수단이 없어서,
 * 이것이 없으면 커뮤니티와 상점과 뱃지와 마이페이지가 통째로 죽는다.
 */
export function LoginSheet({ feature, reason }: Props) {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const { bypass } = useAccount();

  const notReady = () => toast('인증이 아직 붙지 않았어요');

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => router.replace('/')}>
      <View style={styles.wrap}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="닫고 홈으로"
        />

        <View style={[styles.sheet, { backgroundColor: colors.surfaceSolid }]}>
          <View style={[styles.art, { backgroundColor: colors.faceBg }]}>
            <EmotionFace emotion="SHY" size={46} />
          </View>

          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {feature}는 로그인하고 쓸 수 있어요
          </Text>
          <SketchLine color={colors.primary} seed={37} sway={2.2} style={styles.underline} />
          <Muted style={styles.reason}>{reason}</Muted>

          {/* `fill` 을 주면 안 된다 - 그것은 flex:1 이라 **세로로 쌓은 칸에서는 높이를 나눠 갖는다.**
              실제로 두 버튼이 높이 0 으로 찌그러졌다. 가로를 채우는 일은 부모의 stretch 가 한다 */}
          <View style={styles.actions}>
            <Button label="Apple로 계속하기" size="large" onPress={notReady} />
            <Button label="Google로 계속하기" size="large" variant="soft" onPress={notReady} />
          </View>

          {/* 임시 통로. 인증이 붙는 날 이 버튼과 AccountProvider 의 bypass 를 함께 지운다 */}
          <Button label="그냥 둘러보기" size="medium" variant="ghost" onPress={bypass} />

          <Note style={styles.footnote}>
            쓰던 기록은 그대로예요. 로그인해도 지금까지 쓴 일기가 이어집니다.
          </Note>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.lg,
    padding: space[6],
    paddingBottom: space[12],
    gap: space[3],
    alignItems: 'center',
  },
  art: {
    width: 78,
    height: 78,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: font.xl,
    lineHeight: leading(font.xl, 1.3),
    fontFamily: font.bold,
    textAlign: 'center',
  },
  underline: { width: '46%' },
  reason: { textAlign: 'center', maxWidth: 280 },
  actions: { alignSelf: 'stretch', gap: space[2], marginTop: space[2] },
  footnote: { textAlign: 'center', marginTop: space[1] },
});
