/**
 * 손그림 도형 엔진. **RN 판 rough.js** 에 해당한다.
 *
 * <p>원본(SketchUI)은 `rough.js` 의 `rc.path(d, options)` 로 도형을 그린다. 그 라이브러리는
 * 브라우저 DOM(Canvas/SVG)에 직접 노드를 만들어 붙이므로 RN 에서 돌지 않는다. 그래서 같은 입력
 * (경로 + roughness/bowing/fillStyle/hachureGap/seed)을 받아 **`react-native-svg` 가 그릴 수 있는
 * 자료**로 바꾸는 층을 따로 둔다. 컴포넌트는 이 모듈만 보고, 손그림의 수학은 전부 여기 있다.
 *
 * <p>규칙과 수치의 출처는 `.claude/skills/hand-drawn-ui/`.
 */

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag';

export type RoughOptions = {
    /** 떨림. 기본 1.4, 강조·눌림 1.9 */
    roughness?: number;
    /** 직선의 휨. 사람 손은 긴 직선을 못 긋는다 */
    bowing?: number;
    strokeWidth?: number;
    fillStyle?: FillStyle;
    /** 빗금 간격. 눌렸을 때 0.75 로 좁히면 힘줘 칠한 것처럼 진해진다 */
    hachureGap?: number;
    hachureAngle?: number;
    /** 같은 자리는 늘 같은 선이어야 한다. 매 렌더 새로 뽑으면 선이 춤춘다 */
    seed?: number;
};

export const ROUGH_DEFAULTS = {
    roughness: 1.4,
    bowing: 0.8,
    strokeWidth: 1.7,
    fillStyle: 'hachure' as FillStyle,
    hachureGap: 5,
    hachureAngle: -10,
    seed: 1,
};

export type Point = [number, number];

/** 같은 seed 면 같은 그림. rough.js 의 seed 와 같은 역할이다 */
export function makeRandom(seed: number) {
    let state = (seed * 9301 + 49297) % 233280;
    return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
}

/** 색 문자열처럼 숫자가 아닌 값에서 seed 를 만든다(원본의 getSeedFromString) */
export function seedFromString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 1000;
}

// ---------------------------------------------------------------- 도형의 점

/** 모서리가 둥근 사각형의 둘레를 `step` 간격으로 찍는다 */
export function roundedRectPoints(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    step = 7,
): Point[] {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    const points: Point[] = [];
    const HALF_PI = Math.PI / 2;

    const arc = (cx: number, cy: number, from: number, to: number) => {
        const length = Math.abs(to - from) * r;
        const count = Math.max(2, Math.round(length / step));
        for (let i = 0; i <= count; i += 1) {
            const angle = from + ((to - from) * i) / count;
            points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
        }
    };
    const edge = (x1: number, y1: number, x2: number, y2: number) => {
        const length = Math.hypot(x2 - x1, y2 - y1);
        const count = Math.max(1, Math.round(length / step));
        for (let i = 1; i < count; i += 1) {
            points.push([x1 + ((x2 - x1) * i) / count, y1 + ((y2 - y1) * i) / count]);
        }
    };

    arc(x + r, y + r, Math.PI, Math.PI * 1.5);
    edge(x + r, y, x + width - r, y);
    arc(x + width - r, y + r, Math.PI * 1.5, Math.PI * 2);
    edge(x + width, y + r, x + width, y + height - r);
    arc(x + width - r, y + height - r, 0, HALF_PI);
    edge(x + width - r, y + height, x + r, y + height);
    arc(x + r, y + height - r, HALF_PI, Math.PI);
    edge(x, y + height - r, x, y + r);

    return points;
}

/** 타원. 원은 width === height 로 부른다 */
export function ellipsePoints(
    cx: number,
    cy: number,
    width: number,
    height: number,
    step = 7,
): Point[] {
    const rx = width / 2;
    const ry = height / 2;
    const count = Math.max(12, Math.round((Math.PI * (rx + ry)) / step));
    return Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count;
        return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry] as Point;
    });
}

/** 꼭짓점만 주면 변을 따라 점을 채운다. 3D 옆면·테이프의 찢긴 가장자리가 쓴다 */
export function polygonPoints(corners: Point[], step = 7): Point[] {
    const points: Point[] = [];
    corners.forEach((corner, index) => {
        const next = corners[(index + 1) % corners.length];
        points.push(corner);
        const length = Math.hypot(next[0] - corner[0], next[1] - corner[1]);
        const count = Math.max(1, Math.round(length / step));
        for (let i = 1; i < count; i += 1) {
            points.push([
                corner[0] + ((next[0] - corner[0]) * i) / count,
                corner[1] + ((next[1] - corner[1]) * i) / count,
            ]);
        }
    });
    return points;
}

// ---------------------------------------------------------------- 선 만들기

/**
 * 점들을 흔들어 2차 곡선으로 잇는다. **꺾은선으로 이으면 떨림이 각져 "깨진 선"이 된다.**
 *
 * @param roughness 떨림의 크기. 1.4 가 기본, 1.9 는 강조
 * @param bowing    변의 가운데가 더 휘게 한다. 사람 손이 긴 직선을 못 긋는 것을 흉내 낸다
 */
export function sketchPath(
    points: Point[],
    roughness: number,
    bowing: number,
    seed: number,
    closed = true,
): string {
    if (points.length < 2) {
        return '';
    }
    const rand = makeRandom(seed);
    const amount = roughness * 0.8;

    const moved: Point[] = points.map(([px, py], index) => {
        // 변의 가운데일수록 더 휘게 - 양 끝(모서리)은 덜 흔들려야 모양이 유지된다
        const t = index / points.length;
        const bow = Math.sin(t * Math.PI * 2) * bowing * 0.6;
        return [px + (rand() - 0.5) * amount * 2 + bow, py + (rand() - 0.5) * amount * 2 + bow];
    });

    const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const n = moved.length;
    const start = closed ? mid(moved[n - 1], moved[0]) : moved[0];

    let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i += 1) {
        const current = moved[i];
        const next = moved[(i + 1) % n];
        const end = closed ? mid(current, next) : next;
        d += ` Q ${current[0].toFixed(2)} ${current[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
    }
    return closed ? `${d} Z` : d;
}

/** 점들을 그대로 잇는 매끈한 경로. 채우기와 잘라내기(ClipPath)에 쓴다 */
export function solidPath(points: Point[]): string {
    if (points.length < 2) {
        return '';
    }
    return (
        points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`).join(' ') +
        ' Z'
    );
}

// ---------------------------------------------------------------- 채우기

export type HatchLine = { x1: number; y1: number; x2: number; y2: number };
export type Dot = { cx: number; cy: number; r: number };

/**
 * 빗금. 도형의 바깥 사각형을 가로지르는 평행선을 만들고, 그리는 쪽에서 `ClipPath` 로 도형 안쪽만 남긴다.
 * 선마다 조금씩 어긋나야 색연필로 칠한 것처럼 보인다 - 자로 그은 평행선은 패턴 무늬가 된다.
 */
export function hachureLines(
    width: number,
    height: number,
    gap: number,
    angleDeg: number,
    seed: number,
    roughness = 1,
): HatchLine[] {
    const rand = makeRandom(seed + 31);
    const angle = (angleDeg * Math.PI) / 180;
    const span = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
    const count = Math.ceil(span / Math.max(0.5, gap)) + 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const length = width + height;
    const lines: HatchLine[] = [];

    for (let i = 0; i < count; i += 1) {
        const offset = i * gap - span / 2;
        // 선의 기준점을 도형 가운데에서 법선 방향으로 민다
        const cx = width / 2 - dy * offset;
        const cy = height / 2 + dx * offset;
        const jitter = (rand() - 0.5) * roughness;
        lines.push({
            x1: cx - dx * length + jitter,
            y1: cy - dy * length + jitter,
            x2: cx + dx * length + (rand() - 0.5) * roughness,
            y2: cy + dy * length + (rand() - 0.5) * roughness,
        });
    }
    return lines;
}

/** 점묘. 연한 강조와 비활성에 쓴다 */
export function dotFill(width: number, height: number, gap: number, seed: number): Dot[] {
    const rand = makeRandom(seed + 57);
    const dots: Dot[] = [];
    for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
            dots.push({
                cx: x + (rand() - 0.5) * gap * 0.4,
                cy: y + (rand() - 0.5) * gap * 0.4,
                r: 0.7 + rand() * 0.5,
            });
        }
    }
    return dots;
}

/**
 * 채우기 한 벌을 통째로 만든다. 컴포넌트가 fillStyle 마다 분기하지 않게 한다.
 * `zigzag` 는 빗금의 끝을 번갈아 이어 왕복해 칠한 자국을 만든다.
 */
export function buildFill(
    width: number,
    height: number,
    style: FillStyle,
    gap: number,
    angle: number,
    seed: number,
    roughness: number,
): { lines: HatchLine[]; dots: Dot[]; zigzag: string | null } {
    if (style === 'solid') {
        return { lines: [], dots: [], zigzag: null };
    }
    if (style === 'dots') {
        return { lines: [], dots: dotFill(width, height, Math.max(4, gap + 2), seed), zigzag: null };
    }
    if (style === 'cross-hatch') {
        return {
            lines: [
                ...hachureLines(width, height, gap, angle, seed, roughness),
                ...hachureLines(width, height, gap, angle + 90, seed + 13, roughness),
            ],
            dots: [],
            zigzag: null,
        };
    }
    if (style === 'dashed') {
        const full = hachureLines(width, height, gap, angle, seed, roughness);
        const dashed: HatchLine[] = [];
        full.forEach((line, index) => {
            const parts = 6;
            for (let i = 0; i < parts; i += 2) {
                const t1 = i / parts;
                const t2 = (i + 1) / parts;
                dashed.push({
                    x1: line.x1 + (line.x2 - line.x1) * t1,
                    y1: line.y1 + (line.y2 - line.y1) * t1,
                    x2: line.x1 + (line.x2 - line.x1) * t2,
                    y2: line.y1 + (line.y2 - line.y1) * t2,
                });
            }
            void index;
        });
        return { lines: dashed, dots: [], zigzag: null };
    }
    if (style === 'zigzag') {
        const full = hachureLines(width, height, gap * 1.4, angle, seed, roughness);
        let d = '';
        full.forEach((line, index) => {
            const forward = index % 2 === 0;
            const a = forward ? [line.x1, line.y1] : [line.x2, line.y2];
            const b = forward ? [line.x2, line.y2] : [line.x1, line.y1];
            d += index === 0 ? `M ${a[0]} ${a[1]}` : ` L ${a[0]} ${a[1]}`;
            d += ` L ${b[0]} ${b[1]}`;
        });
        return { lines: [], dots: [], zigzag: d || null };
    }
    return { lines: hachureLines(width, height, gap, angle, seed, roughness), dots: [], zigzag: null };
}

// ---------------------------------------------------------------- 변형별 값

/** 원본(SketchUI)의 변형 색. 밝고 장난스러운 쪽이다 */
export const SKETCH_VARIANT: Record<string, { fill: string; seed: number }> = {
    yellow: { fill: '#F2F272', seed: 20 },
    purple: { fill: '#d8c7ff', seed: 40 },
    green: { fill: '#bbf7d0', seed: 60 },
    pink: { fill: '#fbcfe8', seed: 80 },
    blue: { fill: '#bfdbfe', seed: 100 },
    gray: { fill: '#e5e7eb', seed: 120 },
    silver: { fill: '#d1d5db', seed: 140 },
    red: { fill: '#fecaca', seed: 160 },
    orange: { fill: '#fed7aa', seed: 180 },
    sky: { fill: '#bae6fd', seed: 200 },
};

/** 테이프 색은 따로다 - 더 진하고 불투명도로 비친다 */
export const TAPE_VARIANT: Record<string, { fill: string; seed: number }> = {
    yellow: { fill: '#fde047', seed: 20 },
    pink: { fill: '#f9a8d4', seed: 40 },
    green: { fill: '#86efac', seed: 60 },
    blue: { fill: '#93c5fd', seed: 80 },
    purple: { fill: '#c084fc', seed: 100 },
    orange: { fill: '#fdba74', seed: 120 },
    gray: { fill: '#d1d5db', seed: 140 },
    kraft: { fill: '#E8D5B5', seed: 160 },
};
