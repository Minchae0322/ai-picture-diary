# 컴포넌트 카탈로그 - 수치와 설계

**이 문서는 설계도지 구현 목록이 아니다.** 실제로 만들어진 것은 `SKILL.md` 5장의 표에 있고,
여기 적힌 나머지는 "만들 때 이 수치로 만든다"는 뜻이다.

`SKILL.md` 가 규칙이고 여기는 자재다. 수치는 [SketchUI](https://sketchui.sanjoydev.com/) 의 기본값을
가져오되, 한글·모바일·React Native 에서 달라지는 지점을 같이 적었다.

## 공통 - 선 옵션

모든 컴포넌트가 이 값을 공유한다. 컴포넌트마다 다시 정하지 않는다.

```ts
const ROUGH = {
  roughness: 1.4,      // 떨림. 강조·hover 는 1.9
  bowing: 0.8,         // 직선의 휨
  stroke: '#111111',   // 흑연. 순수 검정 아님
  strokeWidth: 1.7,
  fillStyle: 'hachure',
  hachureGap: 5,       // 눌렸을 때 0.75 로 좁혀 진하게
  hachureAngle: -35,
  seed: 1,             // 자리마다 고정. 매 렌더 새로 뽑지 않는다
};
```

RN 에는 Rough.js 가 없다. 같은 선을 만드는 절차는 `SKILL.md` 6장, 구현은
`app/src/shared/ui/SketchBorder.tsx`.

---

## 바탕

### Paper
종이 한 장. 바탕색 `#FAF6ED`, 노이즈 불투명도 `0.025~0.03`, 네 귀 비대칭 라운드.
그림자는 `2px 3px 0 #D9CEBC`(딱딱한 것) + 아주 약한 블러.

### NotebookBackground
공책 괘선. 32px 간격 가로선 `rgba(59,59,59,0.04)`. 왼쪽에 빨간 세로 여백선을 넣으면 공책 티가 확 산다.
**글이 올라가는 면에는 괘선을 넣지 않는다** - 글줄과 괘선이 어긋나면 더 지저분하다.

### DoodleGridBackground
모눈 24px(`rgba(59,59,59,0.06)`) + 별·화살표·소용돌이 낙서를 불투명도 `0.12` 로 흩뿌린다.
낙서는 **내용과 겹치지 않는 가장자리**에만. 떠다니는 애니메이션은 6~9초, 이동 10px 이내.

---

## 틀

### Card
| prop | 기본 |
|---|---|
| `height` | 220 |
| `shape` | rounded-rectangle |
| `radius` | 18 |
| `padding` | 24 |
| `borderColor` | `#111` |
| `borderStyle` | rough / dashed / project-corner |
| `foldSide` / `foldSize` | top-right / 22 |

변형: yellow, purple, green, pink, blue, gray, silver, red, orange, sky, **paper**(기본).
`project-corner` 는 모서리를 접은 효과 - 메모지 느낌이 필요할 때.
홀수 카드 `-0.8도`, 짝수 `+0.5도` 로 번갈아 기울이면 손으로 놓은 더미가 된다.

### SketchBorder
테두리만. 면이 필요 없고 경계만 손으로 긋고 싶을 때. 이 저장소 구현이 여기 해당한다.

### Separator
직선 `<hr>` 을 쓰지 않는다. 물결 SVG 를 가로로 반복한다.

```
M2 4 Q20 1,40 5 T80 3 T120 5 T160 3 T200 5
```
색 `#A09888`, 굵기 2, 폭의 70~80%만 쓰고 가운데 정렬. 별(`✦`)을 양 끝에 넣는 변형도 있다.

### SectionTitle
손글씨 제목 + 아래 물결 밑줄. 밑줄은 제목 폭의 55~60%, 색은 강조색(`#E87461`).

---

## 행동

### Button
| prop | 기본 |
|---|---|
| `width` / `height` | 180 / 48 |
| `fontSize` / `fontWeight` | 18 / bold |
| `cornerRadius` | 12 |
| `hoverTranslateY` | -4 |
| `hoverRotate` | -1도 |
| `enable3D` / `depth` / `depthAngle` | false / 12 / 35도 |
| `depthFill` | `#fffbf2` |

- hover 에서 `roughness` 1.4 -> 1.9, `hachureGap` 5 -> 0.75. **더 세게 칠한 것처럼** 보인다.
- 3D 는 옆면(각도 85도)과 바닥면(-35도)을 빗금으로 채우고 `depthRoughness` 를 +0.35.
- **모바일에는 hover 가 없다.** 눌림 상태로 같은 변화를 준다. 높이는 48 이상(터치 44 규칙).
- 글자가 올라가므로 면은 `solid`, 테두리만 거칠게 - 빗금 위 글자는 못 읽는다.

### Toggle / Checkbox
스위치 손잡이는 정원이 아니라 **찌그러진 원**. 체크 표시는 폰트 글리프가 아니라 **두 획으로 그은 V**
(`M4 10 L8 15 L17 4`), 끝을 둥글게. 켜짐은 빗금 채움, 꺼짐은 빈 면.

### Combobox
열린 목록은 종이 한 장(`Paper`)으로 띄우고 위를 `Tape` 로 붙인다. 고른 항목에 손그림 체크.

---

## 알림

### Toast
화면 구석에 **붙인 쪽지**. 살짝 기울이고(`-1.5도`) 딱딱한 그림자. 사라질 때 아래로 미끄러지기보다
**떼어내듯** 불투명도와 회전을 같이 준다.

### Alert
테이프로 붙인 경고문. 심각도는 색이 아니라 **테이프 색**으로 구분한다(경고 노랑, 위험 산호).
색만으로 뜻을 전하지 않도록 아이콘(느낌표 낙서)을 같이 둔다.

### Tooltip / HoverCard
말풍선. 꼬리는 삼각형 두 겹(테두리색 + 면색)으로 만들고 본체는 네 귀 비대칭 라운드
(`20px 16px 20px 4px`). 글자는 주석용 손글씨(한글이면 Gamja Flower).

---

## 조각

### Badge
스티커. 작은 비대칭 라운드(`10px 4px 8px 4px`), 바탕은 연한 색(`#F5C6C2`), 글자는 그 색의 진한 쪽.
숫자 뱃지는 정원 대신 찌그러진 원.

### Tape
**마스킹 테이프.** 이 체계에서 가장 값싸고 효과가 큰 조각이다.
- 폭 60~90, 높이 24~28, 불투명도 `0.75`, 기울기 `-4도 ~ +6도`
- 색은 크라프트(`#E8D5B5`) 또는 연한 강조색. 양 끝은 **톱니처럼 잘린 가장자리**
- 카드 위 귀 하나에 붙이거나, 사진 네 귀에 붙인다

### Avatar
찌그러진 원 + 손그림 테두리. 사진이 없으면 이니셜 대신 **낙서 얼굴**을 둔다.

### Loader
빙글 도는 원을 쓰지 않는다. 셋 중 하나.
1. 선이 그려졌다 지워지는 반복(`stroke-dasharray` 애니메이션)
2. 빗금이 왼쪽부터 차오르기
3. 연필이 종이를 끄적이는 짧은 획 3개가 번갈아 진해지기

### Calendar
칸을 표로 긋지 않고 **동그라미로** 표시한다. 오늘은 손으로 두 번 둘러친 원.
선택은 색연필로 칠한 면.

---

## RN 구현 조각

### 빗금 채우기

```tsx
// 간격 5, 각도 -35도. ClipPath 로 도형 안쪽만 남긴다
<Defs>
  <ClipPath id="shape"><Path d={shapePath} /></ClipPath>
</Defs>
<G clipPath="url(#shape)">
  {lines.map((y, i) => (
    <Line key={i} x1={-h} y1={y} x2={w + h} y2={y - (w + h) * Math.tan(-35 * Math.PI / 180)}
          stroke={color} strokeWidth={1.2} strokeOpacity={0.75} />
  ))}
</G>
```

### 종이 질감
`feTurbulence` 는 `react-native-svg` 에서 지원하지 않는다. 둘 중 하나.
- 작은 노이즈 PNG(64x64 정도)를 `ImageBackground` 로 타일링
- `Circle` 수백 개를 불투명도 0.02~0.04 로 흩뿌린 SVG 한 장(정적이라 한 번만 계산)

### 딱딱한 그림자
RN 그림자는 블러가 기본이라 종이 느낌이 안 난다. **같은 모양의 면을 하나 더 깔고 2~3px 밀면** 된다.

```tsx
<View style={{ position: 'absolute', inset: 0, transform: [{ translateX: 2 }, { translateY: 3 }],
               backgroundColor: '#D9CEBC', borderRadius: corner }} />
```

### 기울임
`transform: [{ rotate: '-0.8deg' }]`. **누르는 요소에는 주지 않는다.**
RN 은 회전해도 터치 영역이 따라가지만, 사용자 눈에 과녁이 흔들려 보인다.

---

## 적용 순서

한 번에 다 바꾸지 않는다. 이 순서가 들인 품 대비 체감이 크다.

1. **바탕을 종이로** - 색 하나와 노이즈. 가장 싸고 가장 크게 바뀐다
2. **테두리를 손으로** - 카드·입력창의 `borderWidth` 를 스케치 선으로
3. **모서리를 비대칭으로** - 값 네 개만 바꾸면 된다
4. **제목을 손글씨로** - 한글이면 Gaegu. 본문은 그대로 둔다
5. **구분선과 밑줄을 물결로**
6. **테이프와 낙서** - 마지막. 먼저 넣으면 정리 안 된 화면에 장식만 얹는 꼴이 된다
