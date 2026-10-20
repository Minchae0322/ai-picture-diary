import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { SketchLine } from '@/shared/ui/SketchLine';
import { Tape } from '@/shared/ui/Tape';
import { Heading, Muted, Note } from '@/shared/ui/Type';
import { font, leading, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { POLL_GIVE_UP_MS } from '@/features/diary/hooks/useDiary';
import { DrawingBoard } from './DrawingBoard';

/**
 * 기다림 안내. **진행률이 아니다.**
 *
 * <p>서버가 단계 이벤트를 주지 않으므로 "무엇을 하는 중인가"는 끝까지 한 문장이고
 * (03 화면 문서 4장·7장), 바뀌는 것은 **얼마나 기다렸나**뿐이다. 둘을 섞으면 시간이 지날 때마다
 * 단계가 넘어가는 것처럼 보여 가짜 진행률이 된다.
 *
 * <p>마지막 칸은 폴링이 멈추는 시각과 같다 - 더 묻지 않는 중인데 "그리는 중"만 두면 거짓이 된다.
 */
const WAITS = [
  { after: 0, text: '한 줄을 읽고 그림을 그려요. 보통 20초쯤 걸려요.' },
  { after: 20_000, text: '아직 그리는 중이에요. 조금만 더 기다려 주세요.' },
  { after: 60_000, text: '오래 걸리고 있어요. 다 그리면 그대로 남아 있으니 기다리지 않아도 돼요.' },
  { after: POLL_GIVE_UP_MS, text: '소식이 늦네요. 지금 확인해 보거나 나중에 다시 와도 돼요.' },
] as const;

type Props = {
  content: string;
  /**
   * `overlay` 02 위에 덮이는 큰 카드. 기본
   * `strip`   "나중에 볼게요" 로 접은 뒤 02 흐름에 남는 띠. 상태만 말하고 조작은 없다
   */
  variant?: 'overlay' | 'strip';
  /** 오버레이를 접는다. 없으면 접는 버튼을 두지 않는다(04 상세 화면은 덮을 것이 없다) */
  onMinimize?: () => void;
  /** 폴링이 멈춘 뒤 사용자가 직접 묻는 길 */
  onCheck?: () => void;
};

/**
 * 03 AI 생성 중.
 *
 * <p>**기다리는 사람에게 필요한 넷**을 위에서 아래로 쌓는다.
 * <ol>
 *   <li>되고 있다는 확신 - 색연필이 칠해 나가는 그림 자리(`DrawingBoard`)
 *   <li>기다리는 근거 - 방금 쓴 한 줄을 그대로
 *   <li>언제까지인지 - 경과에 따라 바뀌는 안내 한 줄
 *   <li>빠져나갈 길 - "나중에 볼게요". 기다림을 강제하지 않는다
 * </ol>
 *
 * <p>진행률 막대를 두지 않는다. 서버가 단계를 주지 않으므로 어떤 비율도 지어낸 값이다
 * (03 화면 규칙). 불확정 막대조차 "막대"라서 차오르는 것처럼 읽히므로 그림 자리로 바꿨다.
 */
export function GeneratingCard({ content, variant = 'overlay', onMinimize, onCheck }: Props) {
  const colors = useColors();
  const stage = useWaitStage();
  const strip = variant === 'strip';
  const stalled = stage === WAITS.length - 1;

  return (
    // 테이프는 카드 **밖**에 둔다. 카드 안쪽 면은 잘라 내기(overflow: hidden)라 모서리에 걸친 것이 반쪽만 남는다
    <View>
      <Card contentStyle={strip ? styles.strip : styles.card} seed={23}>
        <View style={styles.title}>
          <Heading>{strip ? '오늘을 그리는 중' : '오늘을 그리고 있어요'}</Heading>
          {strip ? null : (
            <SketchLine color={colors.primary} seed={19} sway={2.4} wavelength={54} style={styles.underline} />
          )}
        </View>

        {/* 그림 자리가 로딩 표시를 겸한다. 안쪽은 장식이므로 읽어 주는 것은 이 한 겹뿐이다 */}
        <View accessibilityRole="progressbar" accessibilityLabel="AI가 오늘을 그리는 중">
          <DrawingBoard height={strip ? 84 : 150} />
        </View>

        <Text
          numberOfLines={strip ? 1 : 3}
          style={[styles.quote, { color: colors.text }, strip && styles.quoteStrip]}
        >
          {`“${content}”`}
        </Text>

        {/* 안내가 바뀌는 것을 보고 있지 않아도 알게 한다(안드로이드). 글자가 아니라 담은 면에 건다 */}
        <View accessibilityLiveRegion="polite">
          <Muted>{strip ? '다 그리면 여기 그대로 나타나요.' : WAITS[stage].text}</Muted>
        </View>

        {strip ? null : (
          <View style={styles.actions}>
            {stalled && onCheck ? (
              <Button label="지금 확인하기" size="medium" variant="soft" fill onPress={onCheck} />
            ) : null}
            {onMinimize ? (
              <Button
                label="나중에 볼게요"
                size="medium"
                variant={stalled && onCheck ? 'ghost' : 'soft'}
                fill
                onPress={onMinimize}
                accessibilityHint="그리는 것은 계속되고, 다 되면 홈에 나타나요"
              />
            ) : null}
          </View>
        )}

        {strip || !onMinimize ? null : <Note>다른 탭을 봐도 계속 그려요.</Note>}
      </Card>

      {/* 붙여 둔 종이로 보이게 하는 한 조각. 접힌 띠에는 과하다 */}
      {strip ? null : (
        <Tape width={88} height={24} variant="kraft" rotate={-7} opacity={0.75} style={styles.tape} />
      )}
    </View>
  );
}

/**
 * 몇 번째 안내까지 왔는가. **초를 세지 않고 넘어갈 때만 다시 그린다** -
 * 1초마다 상태를 올리면 그릴 것이 없는데도 카드가 초당 한 번 리렌더된다.
 *
 * <p>기준은 이 카드가 뜬 시각이다. 서버가 생성 시작 시각을 주지 않으므로 더 정확한 기준이 없다.
 */
function useWaitStage() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = WAITS.slice(1).map((wait, index) =>
      setTimeout(() => setStage(index + 1), wait.after),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return stage;
}

const styles = StyleSheet.create({
  card: { paddingTop: space[7], paddingBottom: space[6], gap: space[4] },
  strip: { gap: space[3] },
  tape: { position: 'absolute', top: -12, left: space[6] },
  title: { gap: space[1] },
  underline: { marginLeft: 2, width: '62%' },
  quote: {
    fontSize: font.md,
    lineHeight: leading(font.md),
    fontFamily: font.medium,
  },
  quoteStrip: { fontSize: font.sm, lineHeight: leading(font.sm) },
  actions: { flexDirection: 'row', gap: space[2] },
});
