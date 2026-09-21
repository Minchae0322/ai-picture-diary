# 프리셋: Jelly Peach

## 성격

따뜻한 복숭아빛 그라디언트 배경 위에 반투명한 흰 카드를 얹고, 큰 라운드(24~34)와 알약 버튼으로 말랑한 인상을 만든다. 감정·일기·습관처럼 **사용자의 기분을 다루는 개인용 앱**에 맞다. 화면 전체가 하나의 빛 아래 있는 것처럼 보이도록 상단에 은은한 원형 글로우(`sunlight`)를 공통 배경 레이어로 깐다.

쓰면 안 되는 경우: 정보 밀도가 높은 관리자·대시보드. 라운드와 여백이 커서 표가 들어가지 않는다. 그리고 **중립 회색이 거의 없다.** 회색조로 정보를 구분해야 하는 화면은 `soft-modern`을 쓴다.

주 타깃: 모바일 우선. 390x844 기준으로 값을 잡았다.

> 출처: Figma `AI 감정 날씨일기 - Web App Sketch` 페이지 `01 · Mobile Screens`.
> **시안 값을 그대로 옮기지 않았다.** 아래 6장에 어디를 왜 바꿨는지 적었다.

## 1. 원시값

```css
:root {
  /* 배경 - 위에서 아래로 흐르는 복숭아 */
  --peach-50:  #fff6f0;   /* 배경 상단 */
  --peach-100: #ffe9e0;   /* 배경 55% 지점 */
  --peach-200: #ffd9de;   /* 배경 하단 */
  --peach-150: #ffe7d6;   /* 카드 그라디언트 끝 */
  --cream:     #fff5ec;   /* 카드 평균 톤. 대비 계산의 기준 배경 */

  /* 자두빛 텍스트 계열 - 이 프리셋의 중립축. 순수 회색을 쓰지 않는다 */
  --plum-900: #4a3540;
  --plum-600: #6b555d;
  --plum-400: #7e6d73;
  --plum-200: #bca3ab;   /* 장식 전용. 텍스트 금지(2장 참고) */

  /* 브랜드 - 젤리 로즈 */
  --rose-200: #ff8fa8;
  --rose-300: #f2637c;   /* 시안 원본. 장식 전용 */
  --rose-500: #c24f63;   /* 실제 primary */
  --rose-600: #a63f53;

  /* 날씨/악센트 */
  --amber-400:   #ffc46b;
  --amber-200:   #ffd9a6;
  --mauve-300:   #c9bac3;
  --blue-300:    #a9bce8;
  --ice-200:     #cfe3f5;
  --lavender-300:#c6a8e0;
  --mint-300:    #9fd9c7;

  --red-500:   #c2333f;
  --amber-700: #a25b06;
  --green-600: #0f7a53;

  /* 다크 - 시안에 없어 파생했다(4장) */
  --night-900: #1c1318;
  --night-800: #2a1a20;
  --night-700: #271b21;
  --night-600: #33242b;
  --night-fg:  #f6e9ec;
  --night-mut: #cdb6be;
  --night-sub: #a8919a;
  --night-on-primary: #3a1220;
}
```

## 2. 의미 토큰

### 라이트

| 토큰 | 값 | 대비(최악 배경) |
|---|---|---|
| `--color-bg` | 그라디언트 `--peach-50` -> `--peach-100`(55%) -> `--peach-200` | - |
| `--color-surface` | `rgb(255 255 255 / 0.92)` | - |
| `--color-surface-raised` | 그라디언트 `rgb(255 255 255 / 0.85)` -> `rgb(255 231 214 / 0.85)` | - |
| `--color-border` | `rgb(255 255 255 / 0.9)` | - |
| `--color-border-strong` | `#f5e1d6` | - |
| `--color-text` | `var(--plum-900)` | 8.66 |
| `--color-text-muted` | `var(--plum-600)` | 5.27 |
| `--color-text-subtle` | `var(--plum-400)` | 4.52 (표면 위에서만) |
| `--color-primary` | `var(--rose-500)` | 흰 글자 4.57 |
| `--color-primary-hover` | `var(--rose-600)` | 흰 글자 6.07 |
| `--color-primary-fg` | `#ffffff` | - |
| `--color-danger` | `var(--red-500)` | - |
| `--color-warning` | `var(--amber-700)` | - |
| `--color-success` | `var(--green-600)` | - |
| `--color-focus` | `var(--rose-500)` | - |
| `--color-accent-soft` | `var(--rose-300)` | 장식 전용 |

`--color-text-subtle`은 **표면(카드·입력창·탭바) 위에서만** 쓴다. 배경 그라디언트 하단(`--peach-200`) 위에 직접 올리면 3.53으로 떨어진다. 배경 위 보조 텍스트는 `--color-text-muted`를 쓴다.

### 다크

| 토큰 | 값 |
|---|---|
| `--color-bg` | 그라디언트 `--night-900` -> `--night-800` |
| `--color-surface` | `var(--night-700)` |
| `--color-surface-raised` | `var(--night-600)` |
| `--color-border` | `rgb(255 255 255 / 0.10)` |
| `--color-border-strong` | `rgb(255 255 255 / 0.18)` |
| `--color-text` | `var(--night-fg)` |
| `--color-text-muted` | `var(--night-mut)` |
| `--color-text-subtle` | `var(--night-sub)` |
| `--color-primary` | `var(--rose-200)` |
| `--color-primary-hover` | `#ffb3c3` |
| `--color-primary-fg` | `var(--night-on-primary)` |

다크에서 primary를 `--rose-500`에서 `--rose-200`으로 올리고 전경색을 어두운 자두로 뒤집는다. 어두운 배경 위 `--rose-500`은 대비가 부족하다. 깊이는 그림자가 아니라 명도 차이로 낸다: `bg` < `surface` < `surface-raised`.

## 3. 간격 / 라운드 / 그림자 / 타이포 / 모션

```css
:root {
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px;  --space-7: 28px;  --space-8: 32px;
  --space-12: 48px; --space-16: 64px;
  /* --space-7(28px)이 화면 좌우 기본 여백이다. 카드가 가장자리까지 가는 화면은 20px */

  /* 큰 라운드가 이 프리셋의 특징 */
  --radius-sm:   10px;   /* 작은 칩, 잠금 배지 */
  --radius-md:   16px;   /* 썸네일, 작은 카드 */
  --radius-lg:   24px;   /* 안쪽 영역, 시트 */
  --radius-xl:   34px;   /* 주 카드 */
  --radius-full: 9999px; /* 버튼·칩은 전부 알약 */

  --shadow-sm: 0 4px 10px rgb(138 110 120 / 0.10);
  --shadow-md: 0 10px 12px rgb(138 110 120 / 0.16);
  --shadow-lg: 0 10px 22px rgb(194 79 99 / 0.35);   /* 주 버튼 전용. 브랜드색 그림자 */
  --shadow-up: 0 -6px 20px rgb(74 53 64 / 0.10);    /* 탭바처럼 위로 떨어지는 그림자 */

  --font-sans: "Noto Sans KR", Pretendard, -apple-system, system-ui, sans-serif;
  --text-micro: 10px; --leading-micro: 1.2;   /* 탭바 라벨 */
  --text-xs:    12px; --leading-xs: 1.45;
  --text-sm:    13px; --leading-sm: 1.45;
  --text-base:  14px; --leading-base: 1.45;
  --text-md:    15px; --leading-md: 1.45;
  --text-lg:    17px; --leading-lg: 1.45;
  --text-xl:    20px; --leading-xl: 1.35;
  --text-2xl:   24px; --leading-2xl: 1.35;
  --text-3xl:   34px; --leading-3xl: 1.35;
  --weight-normal: 400; --weight-medium: 500; --weight-bold: 700; --weight-black: 900;

  --duration-fast: 150ms; --duration-base: 200ms; --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);

  --z-dropdown: 100; --z-sticky: 200; --z-modal: 300; --z-toast: 400;
}
```

## 4. 특징적인 컴포넌트

**배경**: 모든 화면은 세로 그라디언트 + 상단 우측의 원형 글로우 한 장(`sunlight`, 420x420, 중심 `#ffe0a8` 85% -> 투명)으로 시작한다. 화면마다 다시 만들지 않고 한 컴포넌트로 감싼다.

**카드**: 반투명 흰 그라디언트 + 흰 테두리 1.5px + `--radius-xl` + `--shadow-md`. 배경이 비쳐야 하므로 불투명 흰색을 쓰지 않는다.

**주 버튼**: `--radius-full`, 세로 패딩 19px, 배경 `--color-primary`, 글자 흰색 17px bold, `--shadow-lg`. 그림자에 브랜드색을 섞는 것이 이 프리셋의 표식이다.

**칩**: 알약. 배경은 악센트색 28% 알파, 테두리는 같은 색 55% 알파, 왼쪽에 12px 원형 점. **색만으로 뜻을 전하지 않는다.** 점 옆에 항상 라벨이 붙는다.

## 5. 하지 말 것

- 순수 회색(`#888` 같은) 섞기. 중립축은 자두빛 `--plum-*`이다
- `--plum-200`(#bca3ab)이나 `--rose-300`(#f2637c)을 **텍스트 색으로** 쓰기. 둘 다 장식 전용이다
- 불투명 흰 카드. 배경 그라디언트가 비쳐야 이 프리셋이 성립한다
- 작은 라운드(6~10px)를 카드에 쓰기. 큰 라운드가 정체성이다
- 배경 그라디언트 위에 `--color-text-subtle` 올리기(2장)
- 다크 모드를 만들 때 라이트 색을 그대로 반전시키기

## 6. 시안에서 바꾼 것 (대비 보정)

`figma-workflow` 3장에 따라 시안 값을 그대로 쓰지 않고 대비를 계산해 보정했다. 계산 기준 배경은 `--peach-200`(배경 최하단)과 `--cream`(카드 평균)이다.

| 역할 | 시안 값 | 대비 | 채택 값 | 대비 | 이유 |
|---|---|---|---|---|---|
| 보조 텍스트 | `#8a6e78` | 3.54 | `#6b555d` | 5.27 | 본문 4.5:1 미달 |
| 흐린 텍스트 | `#bca3ab` | 2.20 | `#7e6d73` | 4.52 | 입력 placeholder·비활성 탭 라벨이 전부 이 색이었다 |
| 주 버튼 | `#f2637c` | 흰 글자 3.07 | `#c24f63` | 흰 글자 4.57 | 라벨 17px bold는 큰 글씨(18.66px bold) 기준에 못 미쳐 4.5:1이 필요하다 |

시안 원본 두 색은 버린 것이 아니라 **장식 전용 토큰**(`--plum-200`, `--color-accent-soft`)으로 남겼다. 점선 테두리, 페이지 인디케이터, 큰 글리프처럼 뜻을 담지 않는 자리에서는 시안 그대로 보인다.

날씨색 6종 중 **눈(`--ice-200`)과 무지개(`--rose-200`)는 시안에 없어 파생**했다. 시안에는 맑음·구름조금·흐림·비 4종만 있다.
