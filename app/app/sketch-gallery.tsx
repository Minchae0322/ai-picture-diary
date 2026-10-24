import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SketchBadge } from '@/shared/ui/SketchBadge';
import { SketchButton } from '@/shared/ui/SketchButton';
import { SketchLine } from '@/shared/ui/SketchLine';
import { Tape } from '@/shared/ui/Tape';
import { DrawingBoard } from '@/features/diary/ui/DrawingBoard';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Backdrop } from '@/shared/ui/Screen';

/**
 * 손그림 컴포넌트 견본 화면. **탭바에 넣지 않는다** - 사용자가 보는 화면이 아니라
 * 만드는 사람이 눈으로 확인하는 자리다. `/sketch-gallery` 로 직접 들어온다.
 *
 * <p>`docs/design/components.html` 이 "무엇이 있나"를 보여준다면 이 화면은 **실제 기기에서
 * 어떻게 그려지나**를 보여준다. 둘은 같은 규칙(`.claude/skills/hand-drawn-ui/`)을 따른다.
 */
export default function SketchGallery() {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { backgroundColor: colors.bgTop }]}>
            {/* 견본도 종이 위에서 봐야 한다 - 흰 면에 올려 두면 테두리 농도를 잘못 고른다 */}
            <Backdrop />
            <ScrollView
                contentContainerStyle={[
                    styles.page,
                    { paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[12] },
                ]}
            >
                <Text style={[styles.h1, { color: colors.text }]}>손그림 컴포넌트</Text>
                <Text style={[styles.lead, { color: colors.textMuted }]}>
                    실제 기기에서 그려진 모습. 규칙은 hand-drawn-ui 스킬.
                </Text>

                <Section title="Button - 채우기 6종" colors={colors}>
                    <View style={styles.row}>
                        <SketchButton variant="yellow" width={150} height={46}>
                            hachure
                        </SketchButton>
                        <SketchButton variant="green" width={150} height={46} fillStyle="cross-hatch">
                            cross-hatch
                        </SketchButton>
                    </View>
                    <View style={styles.row}>
                        <SketchButton variant="purple" width={150} height={46} fillStyle="dots">
                            dots
                        </SketchButton>
                        <SketchButton variant="sky" width={150} height={46} fillStyle="zigzag">
                            zigzag
                        </SketchButton>
                    </View>
                    <View style={styles.row}>
                        <SketchButton variant="orange" width={150} height={46} fillStyle="dashed">
                            dashed
                        </SketchButton>
                        <SketchButton variant="pink" width={150} height={46} fillStyle="solid">
                            solid
                        </SketchButton>
                    </View>
                </Section>

                <Section title="Button - 3D 와 비활성" colors={colors}>
                    <View style={styles.row}>
                        <SketchButton variant="yellow" width={140} height={46} enable3D depth={12}>
                            3D 두께
                        </SketchButton>
                        <SketchButton variant="gray" width={120} height={46} disabled>
                            비활성
                        </SketchButton>
                    </View>
                </Section>

                <Section title="Badge - 모양 4종" colors={colors}>
                    <View style={styles.row}>
                        <SketchBadge variant="yellow">행복한</SketchBadge>
                        <SketchBadge variant="green" shape="rectangle">
                            획득
                        </SketchBadge>
                    </View>
                    <View style={styles.row}>
                        <SketchBadge variant="pink" shape="ellipse">
                            2일 연속
                        </SketchBadge>
                        <SketchBadge variant="blue" width={54} height={54} shape="circle" fontSize={15}>
                            12
                        </SketchBadge>
                    </View>
                    <View style={styles.row}>
                        <SketchBadge variant="red" transparent>
                            테두리만
                        </SketchBadge>
                        <SketchBadge variant="silver" fillStyle="cross-hatch">
                            잠김
                        </SketchBadge>
                    </View>
                </Section>

                <Section title="Line - 물결 밑줄과 구분선" colors={colors}>
                    <SketchLine color={colors.primary} seed={19} sway={2.4} wavelength={54} />
                    <SketchLine color={colors.border} seed={41} sway={0.6} strokeWidth={1.6} />
                    <SketchLine color={colors.accentSoft} seed={73} sway={4} wavelength={30} height={14} />
                </Section>

                <Section title="기다림 - 03 의 그림 자리" colors={colors}>
                    <DrawingBoard />
                    <Text style={[styles.note, { color: colors.textSubtle }]}>
                        색연필이 왕복한다. 비율 막대가 아니라 되고 있다는 것만 말한다
                    </Text>
                </Section>

                <Section title="Tape - 가장자리 3종" colors={colors}>
                    <View style={[styles.tapeBed, { backgroundColor: colors.surfaceSolid }]}>
                        <Tape variant="kraft" tapeStyle="smooth" style={{ top: 14, left: 16 }} />
                        <Tape variant="yellow" tapeStyle="torn" rotate={3} style={{ top: 62, left: 16 }} />
                        <Tape variant="pink" tapeStyle="side-torn" rotate={-7} style={{ top: 110, left: 16 }} />
                        <Text style={[styles.tapeNote, { color: colors.textSubtle }]}>
                            smooth · torn · side-torn
                        </Text>
                    </View>
                </Section>
            </ScrollView>
        </View>
    );
}

function Section({
    title,
    colors,
    children,
}: {
    title: string;
    colors: ReturnType<typeof useColors>;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.section}>
            <Text style={[styles.h2, { color: colors.primary }]}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    page: { paddingHorizontal: space[5], gap: space[2] },
    h1: { fontSize: 30, fontFamily: font.black, letterSpacing: -0.6 },
    lead: { fontSize: font.sm, fontFamily: font.regular, marginBottom: space[4] },
    section: { gap: space[3], marginBottom: space[7] },
    h2: { fontSize: font.md, fontFamily: font.bold },
    row: { flexDirection: 'row', gap: space[3], alignItems: 'center', flexWrap: 'wrap' },
    tapeBed: { height: 170, borderRadius: 18, overflow: 'hidden' },
    tapeNote: { position: 'absolute', bottom: 10, left: 18, fontSize: font.xs, fontFamily: font.regular },
    note: { fontSize: font.xs, fontFamily: font.regular },
});
