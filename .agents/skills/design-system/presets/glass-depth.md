# 프리셋: Glass / Depth

## 성격

반투명 레이어, 배경 블러, 그라디언트, 여러 겹의 깊이감. 배경 이미지나 색이 비쳐 보이는 표면 위에 UI가 떠 있는 인상이다. **미디어 서비스, 대시보드, 랜딩 페이지, 플레이어·오버레이 UI**처럼 배경이 존재감을 갖는 화면에 맞는다.

쓰면 안 되는 경우:

- 장시간 읽거나 입력하는 화면. 반투명 배경 위의 텍스트는 대비가 흔들려서 눈이 피로하다.
- 대비 요구가 엄격한 화면(공공, 접근성 감사 대상). 배경이 바뀌면 대비도 바뀌어서 보장하기 어렵다.
- 저사양 기기나 웹뷰가 주 타깃인 경우. `backdrop-filter`는 GPU 비용이 크고 스크롤 중 프레임이 떨어질 수 있다.

**대비 규칙은 이 프리셋에서도 그대로다.** 유리 표면 위 텍스트도 4.5:1을 넘겨야 하므로, 아래처럼 반투명 레이어 뒤에 불투명 베이스를 한 겹 깔아 최저 대비를 보장한다.

주 타깃: 데스크톱 우선과 잘 맞는다. 모바일에서는 블러 반경을 줄이고 레이어 수를 줄인다.

## 1. 원시값

```css
:root {
  --ink-0:   #ffffff;
  --ink-100: #e8ecf4;
  --ink-300: #a8b3c8;
  --ink-500: #6c7a94;
  --ink-700: #2e3648;
  --ink-900: #141a26;
  --ink-950: #0a0e16;

  --accent-300: #7dd3fc;
  --accent-500: #22a7f0;
  --accent-600: #0e86c8;

  --red-500:   #f0455a;
  --amber-500: #f0a020;
  --green-500: #24c08a;

  /* 배경 그라디언트 - 유리가 비칠 대상 */
  --backdrop-light:
    radial-gradient(1200px 600px at 10% -10%, #dbeafe 0%, transparent 60%),
    radial-gradient(900px 500px at 90% 10%, #e9d5ff 0%, transparent 55%),
    #f4f6fb;
  --backdrop-dark:
    radial-gradient(1200px 600px at 10% -10%, #16324f 0%, transparent 60%),
    radial-gradient(900px 500px at 90% 10%, #2a1f47 0%, transparent 55%),
    #0a0e16;
}
```

## 2. 의미 토큰

유리 표면은 색 하나가 아니라 **불투명 베이스 + 반투명 오버레이 + 테두리 + 블러** 네 값의 조합이다.

### 라이트

| 토큰 | 값 |
|---|---|
| `--color-bg` | `var(--backdrop-light)` |
| `--color-surface-base` | `rgb(255 255 255 / 0.72)` (대비 보장용 불투명도 하한) |
| `--color-surface` | `rgb(255 255 255 / 0.60)` |
| `--color-surface-raised` | `rgb(255 255 255 / 0.78)` |
| `--color-border` | `rgb(255 255 255 / 0.55)` |
| `--color-border-strong` | `rgb(255 255 255 / 0.80)` |
| `--color-text` | `var(--ink-900)` |
| `--color-text-muted` | `var(--ink-700)` |
| `--color-text-subtle` | `var(--ink-500)` |
| `--color-primary` | `var(--accent-600)` |
| `--color-primary-hover` | `var(--accent-500)` |
| `--color-primary-fg` | `#ffffff` |
| `--color-focus` | `var(--accent-600)` |
| `--blur-surface` | `16px` |
| `--blur-overlay` | `28px` |

라이트 유리에서 `--color-text-muted`를 `--ink-500`이 아니라 `--ink-700`으로 잡은 이유는, 반투명 표면 뒤 배경이 밝을 때 흐린 회색이 곧바로 대비 미달이 되기 때문이다.

### 다크

| 토큰 | 값 |
|---|---|
| `--color-bg` | `var(--backdrop-dark)` |
| `--color-surface-base` | `rgb(20 26 38 / 0.78)` |
| `--color-surface` | `rgb(255 255 255 / 0.06)` |
| `--color-surface-raised` | `rgb(255 255 255 / 0.10)` |
| `--color-border` | `rgb(255 255 255 / 0.12)` |
| `--color-border-strong` | `rgb(255 255 255 / 0.22)` |
| `--color-text` | `var(--ink-100)` |
| `--color-text-muted` | `var(--ink-300)` |
| `--color-primary` | `var(--accent-300)` |
| `--color-primary-fg` | `var(--ink-950)` |

## 3. 간격 / 라운드 / 그림자 / 모션

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px;  --space-8: 32px;  --space-12: 48px; --space-16: 64px;

  /* 유리판은 두께가 느껴지도록 크게 */
  --radius-sm:   8px;
  --radius-md:  12px;
  --radius-lg:  20px;
  --radius-xl:  28px;
  --radius-full: 9999px;

  /* 그림자 + 안쪽 하이라이트(윗면에 빛이 닿은 느낌) */
  --shadow-color: 220 45% 8%;
  --shadow-sm:
    0 1px 2px hsl(var(--shadow-color) / 0.08),
    0 2px 8px hsl(var(--shadow-color) / 0.10);
  --shadow-md:
    0 2px 6px hsl(var(--shadow-color) / 0.10),
    0 10px 28px hsl(var(--shadow-color) / 0.16);
  --shadow-lg:
    0 6px 12px hsl(var(--shadow-color) / 0.12),
    0 24px 60px hsl(var(--shadow-color) / 0.22);
  --inner-highlight: inset 0 1px 0 rgb(255 255 255 / 0.35);

  --duration-fast: 180ms; --duration-base: 260ms; --duration-slow: 380ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  --z-dropdown: 1000; --z-sticky: 1100; --z-modal: 1300; --z-toast: 1400;
}
```

모션이 soft-modern보다 조금 느리다. 무게감 있는 표면이 빠르게 튀면 재질감이 깨진다.

## 4. 특징적인 컴포넌트

```css
/* 유리 표면 - 불투명 베이스 위에 반투명 레이어를 얹어 최저 대비를 보장한다 */
.glass {
  position: relative;
  background: var(--color-surface-raised);
  backdrop-filter: blur(var(--blur-surface)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-surface)) saturate(140%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md), var(--inner-highlight);
}

/* backdrop-filter 미지원 또는 저사양에서는 불투명 베이스로 폴백 */
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: var(--color-surface-base); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass {
    background: var(--color-surface-base);
    backdrop-filter: none;
  }
}

/* 카드 안쪽 요소 - 라운드 공식 적용 (20 - 16 = 4) */
.glass > .glass-media {
  border-radius: max(0px, calc(var(--radius-lg) - var(--space-4)));
}

/* 버튼 - 유리 위에서는 단색 버튼이 더 잘 읽힌다 */
.button {
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  box-shadow: var(--shadow-sm), var(--inner-highlight);
}
.button--glass {
  background: var(--color-surface);
  color: var(--color-text);
  backdrop-filter: blur(var(--blur-surface));
  border: 1px solid var(--color-border-strong);
}

/* 오버레이(모달 뒷배경) */
.overlay {
  background: rgb(10 14 22 / 0.45);
  backdrop-filter: blur(var(--blur-overlay));
}
```

## 5. 이 프리셋에서 하지 말 것

- **유리 위에 유리 위에 유리.** 반투명 레이어는 2겹까지. 3겹부터는 뒤가 뭔지 알 수 없고 대비가 무너진다.
- 본문 텍스트를 반투명 표면 위에 길게 올리기. 긴 글은 불투명 표면(`--color-surface-base`)에.
- `backdrop-filter`만 쓰고 폴백 없이 두기. 미지원 브라우저에서 배경이 그대로 비쳐 글씨가 안 보인다.
- 스크롤되는 긴 목록의 모든 행에 `backdrop-filter` 적용. 프레임이 떨어진다. 컨테이너 한 겹에만.
- 배경이 바뀔 수 있는 화면(사용자 업로드 이미지 위 등)에서 대비 확인 생략. **가장 밝은 배경과 가장 어두운 배경 양쪽에서 확인한다.**
- 테두리 없이 유리만 쓰기. 밝은 배경 위 밝은 유리는 경계가 사라진다. 테두리가 표면의 가장자리를 만든다.
