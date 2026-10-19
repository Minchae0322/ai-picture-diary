import { useMemo, useRef, useState } from 'react';
import {
    Image,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SketchBorder } from '@/shared/ui/SketchBorder';
import { StrokeCanvas, type Stroke } from './StrokeCanvas';
import { PEN_TOOLS, PEN_WIDTHS, type PenTool } from './penTools';

import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useEmotionColors } from '@/shared/theme/useColors';



type Props = {
    visible: boolean;
    imageUrl: string | null;
    strokes: Stroke[];
    onClose: () => void;
    onSave: (strokes: Stroke[]) => void;
};



/**
 * 그림 위에 덧그리는 **전체 화면** 자리.
 *
 * <p><b>왜 모달인가.</b> 04 결과는 스크롤 안에 있다. 거기서 손가락을 끌면 스크롤과 그리기가
 * 같은 제스처를 두고 싸워서 둘 다 제대로 안 된다. 그릴 때는 스크롤이 없는 화면을 따로 띄우는 것이
 * 맞다 - 그림도 더 크게 보인다.
 *
 * <p><b>도구마다 선이 다른 방식으로 남는다.</b> 굵기·투명도만 바꾸면 전부 같은 펜으로 보인다.
 * <ul>
 *   <li><b>연필</b> 얇고 톱니(dash)가 있다 - 종이 결에 걸린 흑연
 *   <li><b>색연필</b> 같은 선을 <b>세 번</b> 조금씩 어긋나게 긋는다. 왁스가 겹쳐 쌓인 질감
 *   <li><b>사인펜</b> 한 번에 진하게. 끝이 둥글다
 *   <li><b>형광펜</b> 넓고 아주 연하다. 끝이 <b>각지다</b>(butt) - 납작한 펜촉이라 그렇다
 *   <li><b>붓</b> 빨리 그으면 가늘고 천천히 그으면 굵다. 구간마다 굵기를 달리 그린다
 * </ul>
 */
export function DiaryDrawModal({ visible, imageUrl, strokes, onClose, onSave }: Props) {
    const colors = useColors();
    const emotion = useEmotionColors();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const palette = useMemo(
        () => [
            '#3B3B3B',
            emotion.HAPPY,
            emotion.EMBARRASSED,
            emotion.ANGRY,
            emotion.TIRED,
            colors.primary,
            emotion.SAD,
            emotion.SHY,
        ],
        [colors.primary, emotion],
    );

    const [draft, setDraft] = useState<Stroke[]>(strokes);
    const [tool, setTool] = useState<PenTool>('pencil');
    const [color, setColor] = useState(palette[0]);
    const [width, setWidth] = useState(PEN_WIDTHS[1]);
    const [erasing, setErasing] = useState(false);
    const [live, setLive] = useState<Stroke | null>(null);

    // PanResponder 는 만들어질 때의 state 를 붙잡는다. 최신 값은 ref 로 본다
    const now = useRef({ tool, color, width, erasing, draft });
    now.current = { tool, color, width, erasing, draft };
    const points = useRef<Array<[number, number]>>([]);
    const times = useRef<number[]>([]);

    const canvas = Math.min(screenWidth - space[5] * 2, 420);

    const build = (): Stroke => {
        const pts = points.current;
        const base = {
            tool: now.current.tool,
            color: now.current.color,
            width: now.current.width,
            points: pts,
            d: smooth(pts),
        };
        if (now.current.tool !== 'brush') {
            return base;
        }
        return { ...base, segments: taper(pts, times.current, now.current.width) };
    };

    const erase = (x: number, y: number) => {
        const kept = now.current.draft.filter(
            (stroke) => !stroke.points.some(([px, py]) => Math.hypot(px - x, py - y) < 20),
        );
        if (kept.length !== now.current.draft.length) {
            setDraft(kept);
        }
    };

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (event) => {
                    const { locationX, locationY } = event.nativeEvent;
                    if (now.current.erasing) {
                        erase(locationX, locationY);
                        return;
                    }
                    points.current = [[locationX, locationY]];
                    times.current = [Date.now()];
                    setLive(build());
                },
                onPanResponderMove: (event) => {
                    const { locationX, locationY } = event.nativeEvent;
                    if (now.current.erasing) {
                        erase(locationX, locationY);
                        return;
                    }
                    points.current = [...points.current, [locationX, locationY]];
                    times.current = [...times.current, Date.now()];
                    setLive(build());
                },
                onPanResponderRelease: () => {
                    if (now.current.erasing || points.current.length === 0) {
                        return;
                    }
                    const finished = build();
                    points.current = [];
                    times.current = [];
                    setLive(null);
                    setDraft([...now.current.draft, finished]);
                },
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const shown = live ? [...draft, live] : draft;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
            <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
                <View style={styles.head}>
                    <Pressable onPress={onClose} accessibilityRole="button" style={styles.headAction}>
                        <Text style={[styles.headText, { color: colors.textMuted }]}>취소</Text>
                    </Pressable>
                    <Text style={[styles.title, { color: colors.text }]}>덧그리기</Text>
                    <Pressable
                        onPress={() => onSave(draft)}
                        accessibilityRole="button"
                        style={styles.headAction}
                    >
                        <Text style={[styles.headText, { color: colors.primary, fontFamily: font.bold }]}>
                            완료
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.stage}>
                    <View
                        style={[styles.canvas, { width: canvas, height: canvas, backgroundColor: colors.surfaceSolid }]}
                        {...responder.panHandlers}
                    >
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} />
                        ) : null}
                        <StrokeCanvas strokes={shown} />
                        <SketchBorder radius={radius.lg} color={colors.border} strokeWidth={1.6} seed={421} />
                    </View>
                </View>

                <View
                    style={[
                        styles.tools,
                        { backgroundColor: colors.surfaceSolid, paddingBottom: insets.bottom + space[3] },
                    ]}
                >
                    <View style={styles.row}>
                        {PEN_TOOLS.map((item) => {
                            const on = !erasing && tool === item.id;
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => {
                                        setTool(item.id);
                                        setErasing(false);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: on }}
                                    style={[
                                        styles.tool,
                                        { backgroundColor: on ? colors.primary : 'transparent' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.toolText,
                                            { color: on ? colors.primaryFg : colors.textMuted },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                        <Pressable
                            onPress={() => setErasing((value) => !value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: erasing }}
                            style={[
                                styles.tool,
                                { backgroundColor: erasing ? colors.danger : 'transparent' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.toolText,
                                    { color: erasing ? colors.primaryFg : colors.textMuted },
                                ]}
                            >
                                지우개
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.row}>
                        {palette.map((pen) => (
                            <Pressable
                                key={pen}
                                onPress={() => {
                                    setColor(pen);
                                    setErasing(false);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`색 ${pen}`}
                                accessibilityState={{ selected: !erasing && color === pen }}
                                style={styles.swatchHit}
                            >
                                <View style={[styles.swatch, { backgroundColor: pen }]} />
                                {!erasing && color === pen ? (
                                    <View style={[styles.swatchRing, { borderColor: colors.text }]} />
                                ) : null}
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.row}>
                        {PEN_WIDTHS.map((size) => (
                            <Pressable
                                key={size}
                                onPress={() => {
                                    setWidth(size);
                                    setErasing(false);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`굵기 ${size}`}
                                accessibilityState={{ selected: width === size }}
                                style={styles.swatchHit}
                            >
                                <View
                                    style={{
                                        width: size + 8,
                                        height: size + 8,
                                        borderRadius: radius.full,
                                        backgroundColor: width === size ? colors.text : colors.decor,
                                    }}
                                />
                            </Pressable>
                        ))}

                        <View style={styles.spacer} />

                        <Pressable
                            onPress={() => setDraft((value) => value.slice(0, -1))}
                            disabled={draft.length === 0}
                            accessibilityRole="button"
                            style={[styles.tool, { opacity: draft.length === 0 ? 0.35 : 1 }]}
                        >
                            <Text style={[styles.toolText, { color: colors.textMuted }]}>되돌리기</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setDraft([])}
                            disabled={draft.length === 0}
                            accessibilityRole="button"
                            style={[styles.tool, { opacity: draft.length === 0 ? 0.35 : 1 }]}
                        >
                            <Text style={[styles.toolText, { color: colors.textMuted }]}>전체 지우기</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}



/** 손가락이 띄엄띄엄 남긴 점을 2차 곡선으로 잇는다. 꺾은선으로 이으면 각이 진다 */
function smooth(points: Array<[number, number]>) {
    if (points.length === 0) {
        return '';
    }
    if (points.length < 2) {
        const [x, y] = points[0];
        return `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 0.1).toFixed(1)} ${y.toFixed(1)}`;
    }
    let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 1; i < points.length; i += 1) {
        const [px, py] = points[i - 1];
        const [cx, cy] = points[i];
        d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((px + cx) / 2).toFixed(1)} ${((py + cy) / 2).toFixed(1)}`;
    }
    const [lx, ly] = points[points.length - 1];
    return `${d} L ${lx.toFixed(1)} ${ly.toFixed(1)}`;
}

/**
 * 붓. **빠를수록 가늘다** - 실제 붓은 빨리 그으면 먹이 덜 묻는다.
 * 구간마다 굵기가 달라야 하므로 한 경로가 아니라 여러 토막으로 그린다.
 */
function taper(points: Array<[number, number]>, times: number[], base: number) {
    const segments: Array<{ d: string; width: number }> = [];
    for (let i = 1; i < points.length; i += 1) {
        const [px, py] = points[i - 1];
        const [cx, cy] = points[i];
        const distance = Math.hypot(cx - px, cy - py);
        const elapsed = Math.max(1, (times[i] ?? 0) - (times[i - 1] ?? 0));
        const speed = distance / elapsed; // px/ms
        // 느리게(speed 0) 그으면 base*1.6, 빠르게(speed 1 이상) 그으면 base*0.45
        const scale = Math.max(0.45, 1.6 - speed * 1.1);
        segments.push({
            d: `M ${px.toFixed(1)} ${py.toFixed(1)} L ${cx.toFixed(1)} ${cy.toFixed(1)}`,
            width: base * scale,
        });
    }
    return segments;
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space[4],
        paddingVertical: space[3],
    },
    headAction: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
    headText: { fontSize: font.md, fontFamily: font.medium },
    title: { fontSize: font.lg, fontFamily: font.bold },
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    canvas: { borderRadius: radius.lg, overflow: 'hidden' },
    tools: {
        paddingTop: space[3],
        paddingHorizontal: space[4],
        gap: space[3],
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
    tool: { paddingHorizontal: space[3], height: 34, justifyContent: 'center', borderRadius: radius.full },
    toolText: { fontSize: font.sm, fontFamily: font.bold },
    swatchHit: { minWidth: 34, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
    swatch: { width: 24, height: 24, borderRadius: radius.full },
    swatchRing: { position: 'absolute', width: 32, height: 32, borderRadius: radius.full, borderWidth: 2 },
    spacer: { flex: 1 },
});
