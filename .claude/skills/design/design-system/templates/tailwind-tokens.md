# Tailwind 매핑

`tokens.css`를 진실로 두고 Tailwind는 그것을 가리키기만 한다. 값을 두 곳에 적지 않는다.
Tailwind 버전을 먼저 확인한다: v3은 `tailwind.config.js`, v4는 CSS의 `@theme` 블록을 쓴다.

## v3 - tailwind.config.js

```js
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised:  'var(--color-surface-raised)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        content: {
          DEFAULT: 'var(--color-text)',
          muted:   'var(--color-text-muted)',
          subtle:  'var(--color-text-subtle)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          fg:      'var(--color-primary-fg)',
        },
        danger:  'var(--color-danger)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
      },
      spacing: {
        1: 'var(--space-1)',   2: 'var(--space-2)',
        3: 'var(--space-3)',   4: 'var(--space-4)',
        6: 'var(--space-6)',   8: 'var(--space-8)',
        12: 'var(--space-12)', 16: 'var(--space-16)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      fontSize: {
        xs:   ['var(--text-xs)',   { lineHeight: 'var(--leading-xs)' }],
        sm:   ['var(--text-sm)',   { lineHeight: 'var(--leading-sm)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
        lg:   ['var(--text-lg)',   { lineHeight: 'var(--leading-lg)' }],
        xl:   ['var(--text-xl)',   { lineHeight: 'var(--leading-xl)' }],
        '2xl':['var(--text-2xl)',  { lineHeight: 'var(--leading-2xl)' }],
        '3xl':['var(--text-3xl)',  { lineHeight: 'var(--leading-3xl)' }],
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        in:  'var(--ease-in)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky:   'var(--z-sticky)',
        overlay:  'var(--z-overlay)',
        modal:    'var(--z-modal)',
        toast:    'var(--z-toast)',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
}
```

`screens`는 CSS 변수를 못 쓰므로 여기에 숫자로 둔다. `tokens.css` 하단 주석의 값과 일치시킨다.

## v4 - CSS `@theme`

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-bg:            var(--color-bg);
  --color-surface:       var(--color-surface);
  --color-primary:       var(--color-primary);
  --radius-lg:           var(--radius-lg);
  --font-sans:           var(--font-sans);
  /* ... */
}
```

v4는 테마 자체가 CSS 변수라 `@theme inline`으로 기존 토큰을 그대로 연결할 수 있다. 정확한 문법은 사용 중인 v4 버전 문서를 확인한다.

## 투명도 유틸리티

`bg-primary/50` 같은 표기를 쓰려면 색이 알파를 받을 수 있는 형태여야 한다. `var(--color-primary)`가 hex를 가리키면 동작하지 않는다.

```css
/* tokens.css - 채널 값으로 둔다 */
:root {
  --primary-rgb: 59 110 246;
  --color-primary: rgb(var(--primary-rgb));
}
```

```js
// tailwind.config.js
primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
```

## 지켜야 할 것

- 컴포넌트에서 `bg-[#3b6ef6]`나 `p-[13px]` 같은 임의 값을 쓰지 않는다. 필요하면 토큰에 추가한다.
- `dark:` 변형을 컴포넌트마다 붙이지 않는다. 다크는 `tokens.css`의 2단계 재정의로 해결된다. `dark:`가 늘어나면 토큰 설계가 잘못된 것이다.
- Tailwind 클래스와 CSS 변수를 섞어 써도 되지만, 한 컴포넌트 안에서는 한 방식으로 통일한다.
