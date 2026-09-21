# ui-fundamentals - 참고

SKILL.md의 절 번호와 같은 순서.

## 2. 중첩 라운드

### 공식

```
안쪽 반경 = 바깥 반경 - 사이 여백
```

두 곡선이 같은 중심을 공유해야 동심원처럼 보인다. 바깥 카드가 radius 16이고 padding이 8이면 안쪽 요소는 8이어야 두 곡선의 간격이 어디서나 8로 일정하다.

```
바깥 16, 안쪽 16 (틀림)          바깥 16, 안쪽 8 (맞음)
┌──────────────┐                 ┌──────────────┐
│ ╭──────────╮ │  모서리에서      │ ╭──────────╮ │  모서리에서
│ │          │ │  간격이 벌어짐   │ │          │ │  간격이 일정
```

| 바깥 반경 | 여백 | 안쪽 반경 |
|---|---|---|
| 16 | 8 | 8 |
| 16 | 4 | 12 |
| 24 | 12 | 12 |
| 12 | 16 | 0 (계산값 음수 -> 0) |
| 8 | 24 | 자유 (여백이 반경의 2배 이상, 곡선이 서로 영향 없음) |

### CSS로 자동 계산

```css
.card {
  --card-radius: 16px;
  --card-padding: 8px;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
}

.card > * {
  /* max()로 음수 방지 */
  border-radius: max(0px, calc(var(--card-radius) - var(--card-padding)));
}
```

Tailwind에서는 임의 값으로:

```html
<div class="rounded-2xl p-2">
  <img class="rounded-lg" />   <!-- 16 - 8 = 8 -->
</div>
```

### 자주 틀리는 곳

- 카드 안의 썸네일 이미지 (카드와 같은 radius를 줘서 어긋남)
- 입력창 안의 버튼 (`input` radius 8, padding 4 -> 버튼 4)
- 모달 안의 첫 섹션이 모달 위 모서리에 붙을 때
- 아바타를 감싸는 링(`ring`) - 링 두께만큼 안쪽 반경이 작아진다

## 1. 스페이싱 스케일

| 토큰 | px | 용도 |
|---|---|---|
| `space-1` | 4 | 아이콘과 텍스트, 배지 안쪽 |
| `space-2` | 8 | 라벨과 입력창, 인접 요소 |
| `space-3` | 12 | 버튼 안쪽 세로, 촘촘한 목록 |
| `space-4` | 16 | 기본 컨테이너 안쪽 여백 |
| `space-6` | 24 | 카드 안쪽 여백, 필드 사이 |
| `space-8` | 32 | 블록 사이 |
| `space-12` | 48 | 섹션 사이 |
| `space-16` | 64 | 페이지 상하 |

근접성 원칙: 사람은 가까운 것을 한 덩어리로 본다. 라벨-입력창을 8, 필드-필드를 24로 두면 각 필드가 한 덩어리로 읽힌다. 반대로 두면 라벨이 위 필드에 붙어 보인다. **간격 값 자체보다 값들 사이의 비율이 중요하다.**

## 4. 타이포 스케일

| 토큰 | px | line-height | 용도 |
|---|---|---|---|
| `text-xs` | 12 | 1.5 | 캡션, 메타 |
| `text-sm` | 14 | 1.6 | 보조 본문, 표 |
| `text-base` | 16 | 1.6 | 본문 |
| `text-lg` | 20 | 1.4 | 소제목 |
| `text-xl` | 24 | 1.3 | 섹션 제목 |
| `text-2xl` | 32 | 1.25 | 페이지 제목 |
| `text-3xl` | 40 | 1.2 | 히어로 |

- 한글 본문은 영문보다 작아 보인다. 영문 기준으로 만든 스케일을 그대로 쓰면 답답하니 본문을 16 이상으로 잡는 편이 안전하다(추정 - 폰트마다 다르므로 실제 화면에서 확인).
- 줄 길이 제한: `max-width: 65ch` 정도가 45~75자에 대응한다.

## 5. 대비 계산

WCAG 2.2 기준(SC 1.4.3 / 1.4.11):

| 대상 | 최소 대비 |
|---|---|
| 본문 텍스트 | 4.5:1 |
| 큰 텍스트 (18.66px+ 일반, 14px+ 굵게) | 3:1 |
| UI 컴포넌트 경계, 아이콘, 그래프 | 3:1 |
| 비활성 요소, 순수 장식 | 기준 없음 |

- 브라우저 개발자 도구의 색 선택기가 대비를 바로 보여준다. 별도 도구 없이 확인할 수 있다.
- 흔한 실수: 보조 텍스트를 `#999`로. 흰 배경 대비 약 2.8:1로 미달이다. `#6b7280` 정도(약 4.8:1)부터 안전하다.
- 브랜드 색 버튼 위의 흰 글자도 확인 대상이다. 밝은 노랑/연두 배경에 흰 글자는 거의 항상 미달이다.
- 다크 모드는 따로 계산한다. 라이트에서 통과한 조합이 다크에서 떨어지는 일이 흔하다.

## 6. 두 겹 그림자

```css
:root {
  /* 배경 색조를 섞은 그림자 색 */
  --shadow-color: 220 40% 10%;

  --shadow-sm:
    0 1px 2px hsl(var(--shadow-color) / 0.06),
    0 1px 3px hsl(var(--shadow-color) / 0.10);

  --shadow-md:
    0 2px 4px hsl(var(--shadow-color) / 0.06),
    0 4px 12px hsl(var(--shadow-color) / 0.10);

  --shadow-lg:
    0 4px 8px hsl(var(--shadow-color) / 0.06),
    0 12px 32px hsl(var(--shadow-color) / 0.12);
}
```

- 첫 줄은 접촉 그림자(짧고 또렷), 둘째 줄은 확산 그림자(길고 흐림).
- 고도가 올라갈수록 y와 blur는 커지고 불투명도는 **거의 그대로거나 조금만** 커진다. 진하게 만들면 지저분해진다.
- 다크 모드에서는 그림자가 거의 안 보인다. 깊이를 배경 명도 차이나 미세한 테두리(`rgba(255,255,255,0.08)`)로 바꾼다.

## 8. 광학 정렬

수학적 중앙과 시각적 중앙이 다른 대표적인 경우:

- **삼각형/재생 아이콘**: 무게중심이 왼쪽에 쏠려 있어 원 안에 정중앙 배치하면 왼쪽으로 치우쳐 보인다. 오른쪽으로 1~2px 민다.
- **대문자와 소문자 혼용 텍스트**: 소문자 하강부(g, y)가 있으면 아래 여백이 더 필요해 보인다.
- **원형과 사각형**: 같은 높이여도 원이 작아 보인다. 원을 2~4% 크게 만든다.
- **아이콘 버튼**: 아이콘 자체의 여백이 제각각이라 `padding`을 같게 줘도 어긋난다. 아이콘 세트를 통일한다.

기준은 자로 잰 값이 아니라 눈이다. 화면을 흐리게 보거나 축소해서 보면 어긋난 곳이 드러난다.

## 9. 상태 5종 골격

```css
.button {
  --btn-bg: var(--color-primary);
  background: var(--btn-bg);
  transition: background 150ms ease-out, transform 100ms ease-out;
}

.button:hover  { --btn-bg: var(--color-primary-hover); }
.button:active { transform: scale(0.98); }

.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.button:disabled {
  --btn-bg: var(--color-disabled);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
```

- `:focus-visible`은 키보드로 접근했을 때만 표시된다. 마우스 클릭 시 링이 남는 문제 없이 접근성을 지킬 수 있다.
- `outline-offset`을 주면 요소 경계와 겹치지 않아 어떤 배경에서도 보인다.
- `:hover`는 `@media (hover: hover)`로 감싸면 터치 기기에서 hover 잔상이 남지 않는다.

## 10. 적중 영역 키우기

```css
.icon-button {
  position: relative;
  width: 20px;
  height: 20px;
}

.icon-button::after {
  content: "";
  position: absolute;
  inset: -8px;          /* 실제 클릭 영역 36x36 */
}
```

시각적 크기는 유지하면서 타깃만 키운다. 인접 버튼과 영역이 겹치지 않는지 확인한다.

출처: [WCAG 2.2 SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## 12. 모션

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.7, 0, 0.84, 0);
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`prefers-reduced-motion`은 취향 설정이 아니라 **전정기관 장애가 있는 사용자에게 실제 어지럼증을 유발하는 문제**다. 큰 이동, 확대, 패럴랙스가 있는 화면에서는 반드시 처리한다.

## 11. 반응형 패턴

### 미디어 쿼리 없이 되는 것들

```css
/* 카드 그리드 - 폭에 따라 열 수가 알아서 바뀐다 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}

/* 사이드바 + 본문 - 좁아지면 자동으로 세로 배치 */
.layout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}
.layout > .sidebar { flex: 1 1 240px; }
.layout > .main    { flex: 999 1 60%; }   /* 큰 grow로 넓을 때 본문이 차지 */

/* 폰트 크기 - 상한과 하한이 있는 유동 크기 */
.title { font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem); }

/* 본문 폭 */
.prose { max-width: 65ch; margin-inline: auto; }
```

`flex: 999 1 60%`는 "둘 다 들어갈 만큼 넓으면 본문이 대부분을 차지하고, 좁으면 줄바꿈된다"를 미디어 쿼리 없이 만든다.

### 컨테이너 쿼리

같은 컴포넌트가 넓은 본문과 좁은 사이드바 양쪽에 들어간다면 화면 폭이 아니라 **컨테이너 폭**에 반응해야 한다.

```css
.card-container { container-type: inline-size; }

.card { display: block; }

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 120px 1fr;   /* 넓으면 썸네일 옆에 텍스트 */
  }
}
```

미디어 쿼리로 만들면 "사이드바에 들어간 카드가 화면이 넓다는 이유로 가로 배치돼서 찌그러지는" 문제가 생긴다.

### 브레이크포인트

```css
:root {
  --bp-sm: 640px;   /* 큰 폰 가로 */
  --bp-md: 768px;   /* 태블릿 */
  --bp-lg: 1024px;  /* 노트북 */
  --bp-xl: 1280px;  /* 데스크톱 */
}
```

CSS 커스텀 프로퍼티는 미디어 쿼리 조건에 직접 쓸 수 없다(`@media (min-width: var(--bp-md))`는 동작하지 않는다). 전처리기 변수나 Tailwind 설정에 같은 값을 두고 관리하거나, 빌드 단계에서 치환한다. 값이 두 곳에 있으면 주석으로 서로를 가리켜 둔다.

기기 이름으로 정하지 않는 이유: 기기 해상도는 계속 바뀌고, 같은 폭이어도 프로젝트마다 레이아웃이 깨지는 지점이 다르다. 브라우저 폭을 천천히 줄여보면서 어색해지는 순간이 그 프로젝트의 브레이크포인트다.

### 안전 영역

```css
.bottom-bar {
  padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
}
```

`viewport-fit=cover`가 설정돼야 `env()` 값이 0이 아닌 값으로 들어온다.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### 가로 스크롤 가두기

```css
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

본문 전체가 가로로 스크롤되면 거의 항상 버그다. 원인을 찾을 때는 `* { outline: 1px solid red }`로 범인 요소를 찾거나, 개발자 도구에서 `document.body.scrollWidth`와 `clientWidth`를 비교한다.

## 13. 네 가지 상태

```
로딩    -> 스켈레톤(레이아웃 동일) 또는 고정 높이 영역
비어있음 -> 무슨 화면인지 + 지금 할 수 있는 행동 버튼
에러    -> 무슨 일 + 다음 행동(다시 시도 / 문의) + 필요하면 코드
정상    -> 실제 데이터
```

에러 문구는 서버의 `ErrorCode`(`api-design`)를 화면 문구로 매핑하는 표를 한곳에 둔다. 컴포넌트마다 문구를 지어내면 같은 오류가 화면마다 다르게 보인다.

## 참고

- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- Understanding SC 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Understanding SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- MDN - prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN - :focus-visible: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- MDN - CSS container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries
- MDN - env(): https://developer.mozilla.org/en-US/docs/Web/CSS/env
