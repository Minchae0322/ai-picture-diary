# 프리셋: Soft Modern

## 성격

부드러운 라운드, 낮은 대비의 중립 배경, 은은한 두 겹 그림자, 넉넉한 여백. 토스·리니어·노션 계열에서 흔히 보이는 톤이다. 화면이 조용하고 읽기 편해서 **일반 사용자를 대상으로 하는 서비스, 앱 웹뷰, 커머스, SaaS**의 기본값으로 안전하다.

쓰면 안 되는 경우: 한 화면에 표와 지표를 빽빽하게 넣어야 하는 사내 업무 시스템이나 관제 화면. 여백이 넓어 정보가 안 들어간다. 그런 화면은 간격과 라운드를 한 단계씩 줄인 변형을 쓰거나 밀도 높은 프리셋을 따로 만든다.

주 타깃: 모바일 우선과 잘 맞는다. 데스크톱 우선으로 쓸 때는 `--space-*`를 한 단계 줄이는 것을 고려한다.

## 1. 원시값

```css
:root {
  /* 중립 - 파란 색조를 살짝 섞은 회색 */
  --neutral-0:   #ffffff;
  --neutral-50:  #f7f8fa;
  --neutral-100: #eef0f4;
  --neutral-200: #e2e5eb;
  --neutral-300: #cbd0d9;
  --neutral-400: #9aa2b1;
  --neutral-500: #6b7385;
  --neutral-600: #4d5566;
  --neutral-700: #363d4d;
  --neutral-800: #232936;
  --neutral-900: #151a23;
  --neutral-950: #0d1117;

  /* 브랜드 - 프로젝트 색으로 교체하는 부분 */
  --brand-100: #dbe7fe;
  --brand-300: #93b4fd;
  --brand-500: #3b6ef6;
  --brand-600: #2b57d4;
  --brand-700: #2145ab;

  --red-500:    #dc2f3c;
  --red-600:    #b91c28;
  --amber-500:  #d97706;
  --green-500:  #128a5e;
}
```

## 2. 의미 토큰

### 라이트

| 토큰 | 값 |
|---|---|
| `--color-bg` | `var(--neutral-50)` |
| `--color-surface` | `var(--neutral-0)` |
| `--color-surface-raised` | `var(--neutral-0)` |
| `--color-border` | `var(--neutral-200)` |
| `--color-border-strong` | `var(--neutral-300)` |
| `--color-text` | `var(--neutral-900)` |
| `--color-text-muted` | `var(--neutral-500)` |
| `--color-text-subtle` | `var(--neutral-400)` |
| `--color-primary` | `var(--brand-500)` |
| `--color-primary-hover` | `var(--brand-600)` |
| `--color-primary-fg` | `#ffffff` |
| `--color-danger` | `var(--red-500)` |
| `--color-warning` | `var(--amber-500)` |
| `--color-success` | `var(--green-500)` |
| `--color-focus` | `var(--brand-500)` |

### 다크

| 토큰 | 값 |
|---|---|
| `--color-bg` | `var(--neutral-950)` |
| `--color-surface` | `var(--neutral-900)` |
| `--color-surface-raised` | `var(--neutral-800)` |
| `--color-border` | `rgb(255 255 255 / 0.08)` |
| `--color-border-strong` | `rgb(255 255 255 / 0.16)` |
| `--color-text` | `var(--neutral-100)` |
| `--color-text-muted` | `var(--neutral-400)` |
| `--color-text-subtle` | `var(--neutral-500)` |
| `--color-primary` | `var(--brand-300)` |
| `--color-primary-hover` | `var(--brand-100)` |
| `--color-primary-fg` | `var(--neutral-950)` |
| `--color-focus` | `var(--brand-300)` |

다크에서 primary를 밝은 쪽으로 바꾸고 전경색을 어둡게 뒤집는다. 어두운 배경 위에 `--brand-500`을 그대로 쓰면 대비가 부족하다.

## 3. 간격 / 라운드 / 그림자 / 타이포 / 모션

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px;  --space-8: 32px;  --space-12: 48px; --space-16: 64px;

  /* 부드러운 라운드가 이 프리셋의 특징 */
  --radius-sm:   6px;    /* 배지, 태그 */
  --radius-md:  10px;    /* 버튼, 입력창 */
  --radius-lg:  16px;    /* 카드 */
  --radius-xl:  24px;    /* 모달, 시트 */
  --radius-full: 9999px;

  --shadow-color: 222 25% 12%;
  --shadow-sm:
    0 1px 2px hsl(var(--shadow-color) / 0.05),
    0 1px 3px hsl(var(--shadow-color) / 0.08);
  --shadow-md:
    0 2px 4px hsl(var(--shadow-color) / 0.05),
    0 6px 16px hsl(var(--shadow-color) / 0.08);
  --shadow-lg:
    0 4px 8px hsl(var(--shadow-color) / 0.05),
    0 16px 40px hsl(var(--shadow-color) / 0.10);

  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
               system-ui, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
  --text-xs: 12px;  --leading-xs: 1.5;
  --text-sm: 14px;  --leading-sm: 1.6;
  --text-base: 16px; --leading-base: 1.6;
  --text-lg: 20px;  --leading-lg: 1.4;
  --text-xl: 24px;  --leading-xl: 1.3;
  --text-2xl: 32px; --leading-2xl: 1.25;
  --text-3xl: 40px; --leading-3xl: 1.2;
  --weight-normal: 400; --weight-medium: 500; --weight-bold: 700;

  --duration-fast: 150ms; --duration-base: 200ms; --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.7, 0, 0.84, 0);

  --z-dropdown: 1000; --z-sticky: 1100; --z-modal: 1300; --z-toast: 1400;
}
```

라운드 값이 `6 / 10 / 16 / 24`로 벌어져 있다. 중첩할 때 `ui-fundamentals` 2장 공식을 쓴다: 카드(16) 안 padding 8이면 안쪽은 8, padding 4면 12.

## 4. 특징적인 컴포넌트

```css
/* 카드 - 테두리 대신 아주 옅은 그림자로 띄운다 */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
.card > .card-media {                     /* 16 - 24 = 음수 -> 0 */
  border-radius: max(0px, calc(var(--radius-lg) - var(--space-6)));
}

/* 버튼 - 채도 높은 단색, 눌림은 미세한 축소로 */
.button {
  --button-bg: var(--color-primary);
  --button-fg: var(--color-primary-fg);
  background: var(--button-bg);
  color: var(--button-fg);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--weight-medium);
  transition: background var(--duration-fast) var(--ease-out),
              transform 100ms var(--ease-out);
}
.button:active { transform: scale(0.98); }
.button--secondary {
  --button-bg: var(--color-surface);
  --button-fg: var(--color-text);
  border: 1px solid var(--color-border);
}

/* 입력창 - 평소엔 조용하고 포커스에서만 강조 */
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}
.input:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
```

## 5. 이 프리셋에서 하지 말 것

- 진한 테두리 추가. 이 프리셋의 구분은 배경 명도 차이와 옅은 그림자로 한다. 둘 다 쓰면 무거워진다.
- 그림자 불투명도 올리기. 떠 보이게 하고 싶으면 blur와 y를 키운다.
- 라운드 값을 전부 같게 맞추기. 크기별 차이가 이 프리셋의 인상을 만든다.
- 채도 높은 색을 넓은 면적에. 브랜드 색은 버튼, 링크, 강조 아이콘 같은 작은 면적에만.
- 간격을 좁혀서 정보 밀도 올리기. 밀도가 필요하면 프리셋 자체를 바꾸는 게 맞다.
