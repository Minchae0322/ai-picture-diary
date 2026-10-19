# 컴포넌트 코드 예시 (React Native)

**이 파일의 코드를 그대로 쓴다.** 화면마다 손그림 선을 다시 발명하지 않는다.
Rough.js 는 RN 에서 못 쓰므로 `react-native-svg` 로 같은 선을 만든다(`SKILL.md` 6장).

전제: `react-native-svg` 설치됨. 색은 의미 토큰(`useColors()`)에서 받고 hex 를 박지 않는다.

---

## 0. 바탕이 되는 둘

### SketchBorder - 손으로 그은 테두리

모든 틀의 바탕. 구현 전체는 `app/src/shared/ui/SketchBorder.tsx`. 쓰는 쪽은 이렇게만 한다.

```tsx
<View style={{ borderRadius: 24, overflow: 'hidden' }}>
  {children}
  <SketchBorder radius={24} color={colors.border} strokeWidth={1.7} seed={7} />
</View>
```

- `seed` 는 **자리마다 다르게**. 같은 수를 쓰면 네 귀가 똑같이 떨려 도장 찍은 것처럼 보인다.
- `wobble` 기본 1.1. 2 를 넘기면 취한 선이 된다.

### Hatch - 빗금 채우기

색연필로 칠한 면. 색 하나로 칠하는 대신 평행선을 긋는다.

```tsx
import Svg, { Defs, ClipPath, Rect, G, Line } from 'react-native-svg';

export function Hatch({ width, height, radius, color, gap = 5, angle = -35, opacity = 0.75 }) {
  const rad = (angle * Math.PI) / 180;
  const span = width + height;
  const count = Math.ceil(span / gap);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <ClipPath id="hatchClip">
          <Rect x="0" y="0" width={width} height={height} rx={radius} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#hatchClip)">
        {Array.from({ length: count }, (_, i) => {
          const offset = i * gap - height;
          return (
            <Line
              key={i}
              x1={offset}
              y1={0}
              x2={offset + height * Math.tan(rad)}
              y2={height}
              stroke={color}
              strokeWidth={1.2}
              strokeOpacity={opacity}
            />
          );
        })}
      </G>
    </Svg>
  );
}
```

- 간격 5 가 기본. **눌렸을 때 0.75 로 좁히면 힘줘 칠한 것처럼** 진해진다.
- **글자 뒤에는 쓰지 않는다.** 빗금 위 글자는 못 읽는다 - 그 자리는 `solid`.

---

## 1. 틀

### Card

```tsx
<Card seed={11}>
  <Heading>이번 달 기분 추이</Heading>
  <Muted>평균 +1.5</Muted>
</Card>
```

이 저장소의 `Card` 가 이미 `SketchBorder` 를 쓴다. 새 카드를 만들지 말고 이것을 쓴다.
모서리를 네 귀 다르게 하고 싶으면 `contentStyle` 로:

```tsx
contentStyle={{
  borderTopLeftRadius: 26, borderTopRightRadius: 18,
  borderBottomRightRadius: 28, borderBottomLeftRadius: 20,
}}
```

### Separator - 물결 구분선

```tsx
import Svg, { Path } from 'react-native-svg';

export function Separator({ width, color }: { width: number; color: string }) {
  const d = wavePath(width, 8, 7);
  return (
    <Svg width={width} height={10}>
      <Path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** 좌우로 흔들리는 선. amplitude 는 2~3, period 는 40 안팎이 연필 같다 */
function wavePath(width: number, mid: number, period: number) {
  let d = `M 2 ${mid}`;
  for (let x = 2; x < width - 2; x += period * 2) {
    d += ` Q ${x + period / 2} ${mid - 3} ${x + period} ${mid}`;
    d += ` Q ${x + period * 1.5} ${mid + 3} ${x + period * 2} ${mid}`;
  }
  return d;
}
```

### SectionTitle - 손글씨 제목 + 물결 밑줄

```tsx
<View>
  <Text style={{ fontFamily: font.hand, fontSize: 24, color: colors.text }}>{title}</Text>
  <Separator width={titleWidth * 0.6} color={colors.primary} />
</View>
```

밑줄은 제목 폭의 55~60%. 전체 폭을 다 그으면 밑줄이 아니라 구분선이 된다.

---

## 2. 행동

### Button - 빗금 채운 알약

기존 `Button` 에 손그림을 얹는 방법. **면은 solid, 테두리만 거칠게.**

```tsx
<Pressable
  onPress={onPress}
  style={({ pressed }) => [
    {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 24,
      backgroundColor: pressed ? colors.primaryPressed : colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      // 딱딱한 그림자. 블러 그림자는 디지털 티가 난다
      transform: [{ translateY: pressed ? 1 : 0 }],
    },
  ]}
>
  <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.primaryFg }}>{label}</Text>
  <SketchBorder radius={24} color={colors.text} strokeWidth={1.7} seed={seed} />
</Pressable>
```

**누르는 것은 기울이거나 흔들지 않는다.** 움직이는 과녁은 못 누른다.
웹의 `hoverRotate: -1deg` 는 모바일에서 **누름 상태의 translateY 1px** 로 바꿔 받는다.

### 딱딱한 그림자 (종이 두 장)

RN 그림자는 블러가 기본이라 종이 느낌이 안 난다. 같은 모양을 하나 더 깔고 민다.

```tsx
<View style={{ position: 'relative' }}>
  <View
    style={{
      position: 'absolute',
      left: 2, top: 3, right: -2, bottom: -3,
      borderRadius: corner,
      backgroundColor: colors.borderStrong,
    }}
  />
  <View style={{ borderRadius: corner, backgroundColor: colors.surfaceSolid }}>{children}</View>
</View>
```

### Checkbox - 두 획으로 그은 체크

```tsx
<Svg width={22} height={22}>
  {checked ? (
    <Path
      d="M4 11 L9 16 L18 5"
      stroke={colors.primary}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ) : null}
</Svg>
```

폰트 글리프(`✓`)를 쓰지 않는다. 획으로 그어야 손그림이다.

---

## 3. 조각

### Tape - 마스킹 테이프

**가장 값싸고 효과가 크다.** 카드 위 귀에 하나 붙이면 "붙여 둔 종이"가 된다.

```tsx
export function Tape({ color, width = 72, angle = -5 }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -10,
        left: 18,
        width,
        height: 26,
        backgroundColor: color,
        opacity: 0.75,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}
```

- 색은 크라프트(`#E8D5B5`) 또는 연한 강조색. 불투명도 0.75 - 밑이 비쳐야 테이프다.
- 기울기 -6 ~ +6도. 양 끝을 톱니로 자르려면 폭 방향으로 작은 삼각형을 반복해 `ClipPath`.

### Badge - 스티커

```tsx
<View style={{
  paddingHorizontal: 10,
  height: 26,
  justifyContent: 'center',
  backgroundColor: colors.highlightSoft,
  borderTopLeftRadius: 10, borderTopRightRadius: 4,
  borderBottomRightRadius: 8, borderBottomLeftRadius: 4,
}}>
  <Text style={{ fontSize: 11, fontFamily: font.bold, color: colors.text }}>{label}</Text>
</View>
```

네 귀를 다르게 하는 것만으로 "오려 붙인 것"이 된다.

### Loader - 끄적이는 선

빙글 도는 원을 쓰지 않는다. 선이 그어졌다 지워지는 쪽이 이 체계의 기다림이다.

```tsx
const dash = useRef(new Animated.Value(0)).current;
useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(dash, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(dash, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]),
  ).start();
}, [dash]);
```

`stroke-dashoffset` 애니메이션이 RN SVG 에서 제한적이라, 짧은 획 3개의 불투명도를
번갈아 올리는 쪽이 안전하다.

---

## 4. 바탕

### Paper - 종이 질감

`feTurbulence` 는 `react-native-svg` 가 지원하지 않는다. 점을 흩뿌린 SVG 한 장을 깐다.

```tsx
/** 한 번만 계산해 둔다. 매 렌더 새로 뽑으면 종이가 끓는다 */
const GRAIN = Array.from({ length: 420 }, (_, i) => {
  const r = makeRandom(i + 1);
  return { x: r() * 100, y: r() * 100, o: 0.02 + r() * 0.025 };
});

export function PaperGrain() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none"
         pointerEvents="none">
      {GRAIN.map((g, i) => (
        <Circle key={i} cx={g.x} cy={g.y} r={0.35} fill="#3B3B3B" fillOpacity={g.o} />
      ))}
    </Svg>
  );
}
```

### NotebookBackground - 공책 괘선

```tsx
{Array.from({ length: Math.ceil(height / 32) }, (_, i) => (
  <View key={i} style={{
    position: 'absolute', left: 0, right: 0, top: i * 32,
    height: 1, backgroundColor: 'rgba(59,59,59,0.04)',
  }} />
))}
```

**글이 올라가는 면에는 넣지 않는다.** 글줄과 괘선이 어긋나면 더 지저분해진다.

---

## 5. 적용 순서

한 번에 다 바꾸지 않는다. 들인 품 대비 체감이 큰 순서다.

1. 바탕을 종이로 (색 + 질감)
2. 테두리를 손으로 (`SketchBorder`)
3. 모서리를 비대칭으로
4. 제목을 손글씨로 (한글은 Gaegu)
5. 구분선과 밑줄을 물결로
6. 테이프와 낙서 - **마지막.** 먼저 넣으면 정리 안 된 화면에 장식만 얹는 꼴이 된다
