import { StyleSheet, Text, View } from 'react-native';
import { formatTodayHeadline } from '@/shared/format';
import { font, leading, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { StreakBadge } from '@/features/diary/ui/StreakBadge';

/** 홈이 지금 무엇을 하는 화면인가. 02/03/04 가 한 탭에 살아서 머리글도 같이 갈려야 한다. */
export type HomeState = 'empty' | 'generating' | 'done' | 'failed';

/**
 * 02/03/04 공통 머리글.
 *
 * <p><b>전에는 "안녕하세요, {닉네임}님"이었다.</b> 두 가지가 잘못이었다.
 *
 * <ol>
 *   <li><b>상태를 몰랐다.</b> 쓰기 전이든 그리는 중이든 다 쓴 그림을 보고 있든 같은 인사를 했다 -
 *       방금 일기를 끝낸 사람에게 "안녕하세요"라고 말하는 화면이었다.
 *   <li><b>가장 큰 글씨를 가장 쓸모없는 말에 줬다.</b> 24px 두 줄이 머리글의 전부였는데 그 안에
 *       오늘에 대한 정보가 없었다. 닉네임은 서버가 지어 준 값이라("반짝이는 젤리곰") 사용자가
 *       자기를 알아보는 데 쓰지도 않는다. 그건 10 마이페이지의 몫이다.
 * </ol>
 *
 * <p>그래서 <b>날짜를 머리글로 올리고</b> 둘째 줄이 상태를 말하게 했다. 일기장에서 그 장의 정체는
 * 날짜다. 세로로 93 -> 50 으로 줄어 그만큼이 쓰는 자리로 간다(02 화면 문서의 세로 예산 680).
 *
 * <p>연속 기록 칩은 날짜와 <b>같은 줄</b>에 둔다. 둘 다 "오늘이 어떤 날인가"를 말하므로 한 줄에
 * 모이는 것이 맞고, 따로 띄우면 그 칩만 갈 곳 없이 떠다닌다.
 */
export function HomeHeader({ state, streakDays }: { state: HomeState; streakDays: number }) {
    const colors = useColors();

    return (
        <View style={styles.root}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {formatTodayHeadline(new Date())}
                </Text>
                <StreakBadge days={streakDays} />
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {SUBTITLE[state]}
            </Text>
        </View>
    );
}

/**
 * 둘째 줄은 <b>지금 무엇을 할 차례인지</b>를 말한다. 장식 문구를 넣지 않는다.
 *
 * <p>비었을 때만 물음표다 - 질문은 답을 요구하므로 쓰라는 신호가 된다. 나머지는 상태 보고라
 * 평서문이어야 한다. 다 그린 화면이 질문을 하면 또 무언가 하라는 뜻으로 읽힌다.
 */
const SUBTITLE: Record<HomeState, string> = {
    empty: '오늘은 어떤 하루였나요?',
    generating: '오늘을 그리는 중이에요',
    done: '오늘의 그림이 나왔어요',
    failed: '오늘을 그리지 못했어요',
};

const styles = StyleSheet.create({
    root: { gap: space[1] },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    /** flex: 1 이라야 긴 날짜가 칩을 밀지 않고 자기가 줄어든다 */
    title: { flex: 1, fontSize: font.xl, fontFamily: font.bold, lineHeight: leading(font.xl) },
    subtitle: { fontSize: font.base, fontFamily: font.regular },
});
