# design-system - 참고

SKILL.md의 절 번호와 같은 순서.

## 1. 토큰 계층 코드

```css
/* 1단계: 원시값 - 컴포넌트에서 절대 참조하지 않는다 */
:root {
  --gray-50:  #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-400: #94a3b8;
  --gray-600: #475569;
  --gray-900: #0f172a;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
}

/* 2단계: 의미 - 다크 모드에서 이 블록만 다시 정의한다 */
:root {
  --color-bg:             var(--gray-50);
  --color-surface:        #ffffff;
  --color-surface-raised: #ffffff;
  --color-border:         var(--gray-200);
  --color-text:           var(--gray-900);
  --color-text-muted:     var(--gray-600);
  --color-primary:        var(--blue-500);
  --color-primary-hover:  var(--blue-600);
  --color-primary-fg:     #ffffff;
  --color-focus:          var(--blue-500);
}

/* 3단계: 컴포넌트 - 2단계만 참조한다 */
.button {
  --button-bg: var(--color-primary);
  --button-fg: var(--color-primary-fg);
  background: var(--button-bg);
  color: var(--button-fg);
}

.button--ghost {
  --button-bg: transparent;
  --button-fg: var(--color-text);
}
```

3단계를 커스텀 프로퍼티로 두는 이유는 변형마다 CSS 블록을 복제하지 않기 위해서다. `.button--ghost`가 `background`를 다시 선언하지 않고 변수만 바꾼다.

## 3. 주 타깃별 레이아웃 골격

### 모바일 우선

```css
/* 기본 = 좁은 화면 */
.page {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
}
.nav { position: fixed; bottom: 0; inset-inline: 0; }   /* 하단 탭 */

@media (min-width: 768px) {
  .page { padding: var(--space-8); max-width: 720px; margin-inline: auto; }
  .nav  { position: static; }
}
```

- 기본 스타일에 미디어 쿼리가 없다는 점이 핵심이다. 스타일을 **덜어내는** 게 아니라 **더한다.**
- 주요 액션은 엄지가 닿는 하단에. 상단 우측 모서리는 한 손 조작에서 가장 멀다.
- 입력 폼에서 키보드가 올라오면 화면의 절반이 사라진다. 제출 버튼이 키보드에 가리지 않는지 실제 기기에서 확인한다.

### 데스크톱 우선

```css
/* 기본 = 넓은 화면 */
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100dvh;
}

@media (max-width: 1023px) {
  .app { grid-template-columns: 1fr; }        /* 사이드바 접기 */
  .sidebar { position: fixed; transform: translateX(-100%); }
  .sidebar[data-open="true"] { transform: none; }
}
```

- 사내 업무 시스템은 정보 밀도가 우선이다. 여백을 넉넉히 주는 프리셋(soft-modern 기본값)을 그대로 쓰면 한 화면에 들어가야 할 것이 안 들어간다. 밀도 높은 프리셋을 쓰거나 간격 토큰을 한 단계 줄인다.
- 표가 중심인 화면은 가로 스크롤 + 열 고정(sticky first column)을 기본으로 설계한다.
- 키보드 조작(Tab 순서, 단축키, Enter로 저장)을 처음부터 넣는다. 업무 시스템에서 마우스만 쓰는 화면은 느리다.
- 모바일에서 **깨지지는 않게** 한다. 목표는 "폰으로도 확인은 된다"이지 "폰에서도 편집이 편하다"가 아니다.

### 100dvh

`100vh`는 모바일 브라우저에서 주소창 높이를 포함해 화면보다 커진다. `100dvh`(동적 뷰포트 높이)를 쓴다. 구형 브라우저 폴백이 필요하면 `height: 100vh; height: 100dvh;` 순서로 둘 다 쓴다.

## 4. 다크 모드 구현

```css
/* 시스템 설정 따라가기 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg:             #0b0d10;
    --color-surface:        #14171c;
    --color-surface-raised: #1c2027;
    --color-border:         #262b33;
    --color-text:           #e6e8eb;
    --color-text-muted:     #9ba1a9;
  }
}

/* 사용자가 명시적으로 고른 경우 - 양방향 모두 필요 */
:root[data-theme="dark"] {
  --color-bg:             #0b0d10;
  --color-surface:        #14171c;
  --color-surface-raised: #1c2027;
  --color-border:         #262b33;
  --color-text:           #e6e8eb;
  --color-text-muted:     #9ba1a9;
}
```

핵심은 **3단계와 컴포넌트 CSS가 전혀 바뀌지 않는다**는 것이다. 컴포넌트 안에 `@media (prefers-color-scheme: dark)`가 등장하면 토큰 설계가 잘못된 신호다.

값 중복이 싫으면 다크 값을 별도 클래스로 묶고 `:root[data-theme="dark"], @media ... :root:not([data-theme="light"])`를 셀렉터 목록으로 합친다. CSS 전처리기 없이 순수 CSS로도 된다.

### 다크 모드에서 깊이

라이트에서는 그림자가 깊이를 만들지만 다크에서는 거의 안 보인다.

| 고도 | 라이트 | 다크 |
|---|---|---|
| 바닥 | `bg` | `bg` (가장 어두움) |
| 카드 | `surface` + `shadow-sm` | `surface` (한 단계 밝게) |
| 드롭다운/모달 | `surface-raised` + `shadow-lg` | `surface-raised` (더 밝게) + 미세한 테두리 |

다크 모드의 테두리는 `rgba(255,255,255,0.06~0.10)` 정도가 자연스럽다. 검정 계열 테두리는 배경에 묻힌다.

## 색상표 만드는 법

브랜드 색 하나에서 스케일을 만들 때:

- 명도(L)를 균등하게 나누되 **채도는 양 끝에서 낮춘다.** 가장 밝은 단계와 가장 어두운 단계가 채도까지 높으면 형광처럼 보인다.
- 중립 회색에 브랜드 색조를 5~10% 섞으면 화면이 통일돼 보인다. 순수 `#808080` 계열보다 낫다.
- OKLCH를 쓸 수 있으면 명도 간격이 눈에 보이는 대로 나온다. HSL은 같은 L이어도 색상마다 밝기가 달라 보인다.

```css
/* OKLCH 예 - 명도만 바꿔 스케일 생성 */
--brand-100: oklch(0.95 0.03 250);
--brand-500: oklch(0.62 0.18 250);
--brand-900: oklch(0.30 0.09 250);
```

브라우저 지원은 최신 기준으로 넓지만, 대상 브라우저를 확인하고 필요하면 hex 폴백을 함께 둔다.

## Tailwind 매핑

CSS 변수를 그대로 Tailwind 테마에 연결하면 두 벌 관리하지 않아도 된다.

```js
// tailwind.config.js (v3 기준)
export default {
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        border:  'var(--color-border)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted:   'var(--color-text-muted)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          fg:      'var(--color-primary-fg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
}
```

Tailwind v4는 설정 파일 대신 CSS의 `@theme` 블록을 쓴다. 프로젝트의 Tailwind 버전을 먼저 확인하고 형식을 맞춘다.

투명도 유틸리티(`bg-primary/50`)를 쓰려면 색 값이 `<alpha-value>`를 받을 수 있는 형태여야 한다. `var(--color-primary)`가 hex를 가리키면 동작하지 않으므로, 필요하면 원시값을 채널 형태(`--primary-rgb: 59 130 246`)로 두고 `rgb(var(--primary-rgb) / <alpha-value>)`로 연결한다.

## 프리셋 교체 절차

1. 새 프리셋 파일의 값 표로 `tokens.css`의 2단계를 통째로 교체한다.
2. 1단계 원시값도 프리셋이 정의한 것으로 바꾼다.
3. 3단계와 컴포넌트 CSS는 **건드리지 않는다.** 여기를 고쳐야 한다면 그 컴포넌트가 토큰을 우회하고 있다는 뜻이니 그 부분을 먼저 고친다.
4. 프리셋마다 특징적인 컴포넌트 스타일(예: glass의 `backdrop-filter`)은 프리셋 파일의 3번 절에 있다. 해당 클래스만 교체한다.
5. 전체 화면을 훑고 대비를 다시 확인한다.
6. `CLAUDE.md`의 프리셋 선언을 고친다.

교체가 어렵게 느껴진다면 토큰을 우회한 하드코딩이 남아 있다는 신호다. 교체 작업 자체가 시스템 건강 검진이 된다.

## CLAUDE.md 선언 예

```markdown
## 프로젝트 고유

- 주 타깃: 모바일 우선 (데스크톱은 사용 가능한 수준)
- 디자인 프리셋: soft-modern (토큰: `src/styles/tokens.css`)
- 브랜드 primary: #2563eb (프리셋 기본값에서 교체, 대비 확인 완료 2026-09-10)
- 다크 모드: 지원 (`[data-theme]` + 시스템 설정)
```

## 참고

- MDN - Using CSS custom properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- MDN - prefers-color-scheme: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- MDN - oklch(): https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- Tailwind CSS - Theme: https://tailwindcss.com/docs/theme
