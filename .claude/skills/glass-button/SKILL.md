---
name: glass-button
description: Build glassmorphism (frosted glass) UI in CSS — translucent buttons, cards, panels, toolbars using backdrop-filter. Use when the user asks for a "글래스" / "glass" / "유리" / "글래스모피즘" / "frosted" / "반투명" button or panel, an iOS-style liquid glass surface, or wants light-reflection edges on a translucent element. Covers the blur-to-pattern ratio that decides whether the background actually shows through, gradient border highlights, and what backdrop-filter can and cannot do.
---

# 글래스모피즘 (Glass) UI

## 핵심 원칙

**1. 유리 효과는 뒤에 배경이 있어야 보인다**
`backdrop-filter`는 요소 뒤에 실제로 그려진 것을 흐리게 하는 속성이다. 흰 배경이나 단색 배경 위에서는 아무 변화가 없다. 데모/테스트 페이지를 만들 때는 반드시 그라데이션이나 패턴, 도형을 뒤에 깔고 시작한다.

**2. blur 반경은 뒤 배경 디테일 크기에 맞춘다 (가장 자주 틀리는 부분)**
"유리인데 뒤가 안 비친다"는 거의 항상 blur 과다가 원인이다. 뒤 패턴의 셀 크기보다 blur가 크면 인접 픽셀이 평균값으로 뭉개져 그냥 뿌연 면이 된다.

| blur / 패턴 셀 크기 | 결과 |
|---|---|
| 1/10 ~ 1/8 | 패턴이 또렷하게 비침 — "얇은 유리" |
| 1/6 ~ 1/5 | 형체는 알아보되 뭉개짐 — 일반적인 프로스티드 |
| 1/3 이상 | 형체 소멸, 그냥 반투명 회색판 |

34px 체크 패턴 기준 `blur(3~4px)`가 또렷, `blur(12px)`면 완전히 지워진다. 배경이 완만한 그라데이션뿐이라면 셀 크기 개념이 없으므로 `blur(12~20px)`도 괜찮다.

**3. 흰색 오버레이도 비침을 지운다**
`background: rgba(255,255,255,X)`에서 X가 커질수록 뒤가 안 보인다. 패턴을 비추려면 `0.06~0.10`, 밝은 배경 위 단독 요소면 `0.15~0.20`.

**4. blur를 줄이면 채도가 빠진다**
`backdrop-filter: blur(3px) saturate(120%)`처럼 `saturate()`를 같이 걸어 보정한다.

**5. backdrop-filter는 굴절(refraction)을 못 한다**
흐리게만 할 뿐 휘게 하지 않는다. 뒤 도형의 경계는 흐려진 채 직선으로 지나간다. 굴곡이 필요하면:
- SVG `feDisplacementMap` — 진짜 굴절이지만 무겁고 Firefox에서 `backdrop-filter`와 조합이 불안정
- 가장자리에만 추가 `backdrop-filter`를 건 레이어 — 가볍고 iOS 리퀴드글래스에 가까움 (아래 "가장자리 굴절감" 참고)

**6. 밝은 배경 위에서는 흰 글자를 쓰지 말 것**
글래스 예제는 대부분 어두운 배경 기준이라 `color: #fff`로 되어 있다. 배경이 밝으면 그대로 두면 글자가 안 보인다. 진한 남회색(`#2d4254` 등)으로 바꾸고 사용자에게 알린다.

## 기본 레시피

```css
.glass-button {
  position: relative;                    /* 빛 반사선(::before) 기준점 */
  background: rgba(255, 255, 255, 0.10); /* 뒤가 비칠 만큼 옅게 */
  backdrop-filter: blur(4px) saturate(120%);
  -webkit-backdrop-filter: blur(4px) saturate(120%);  /* 사파리 대응 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  color: #2d4254;                        /* 밝은 배경 기준. 어두우면 #fff */
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.18);
}
```

호버 값은 기본값의 2~3배를 넘기지 않는다. 기본이 `0.06`인데 호버가 `0.25`면 튄다.

## 빛 효과 레이어

### 11시·5시 모서리 빛 반사선

유리 모서리가 빛을 받고 반대편에서 반사되는 패턴. 글래스 느낌을 가장 크게 끌어올리는 한 방이다.

마스크로 가운데를 뚫어 1px 링을 만들고, 그 링을 `linear-gradient(135deg, ...)`로 칠한다. 135도는 좌상단→우하단 방향이라 그라데이션의 0% 지점이 11시 모서리, 100% 지점이 5시 모서리에 떨어진다. 양 끝만 밝게 하고 가운데는 투명하게 두면 두 곡선 모서리에서만 빛이 스친다.

```css
.glass-button::before {
  content: "";
  position: absolute;
  inset: -1px;              /* 기존 테두리 위에 겹치게 */
  border-radius: 13px;      /* border-radius + 테두리 두께 */
  padding: 1px;             /* 선 두께 */
  background: linear-gradient(135deg,
    rgba(255,255,255,0.95) 0%,      /* 11시 */
    rgba(255,255,255,0.80) 7%,
    rgba(255,255,255,0)    20%,
    rgba(255,255,255,0)    80%,
    rgba(255,255,255,0.80) 93%,
    rgba(255,255,255,0.95) 100%);   /* 5시 */
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

이 "padding + 이중 마스크 + exclude" 조합이 CSS에서 그라데이션 테두리를 만드는 표준 기법이다. 그라데이션 각도만 바꾸면 빛 방향이 바뀐다.

### 안쪽 하이라이트 (inset box-shadow 3겹)

```css
box-shadow:
  0 8px 32px rgba(45, 66, 84, 0.18),          /* 바깥 그림자 */
  inset 0 1px 1px rgba(255, 255, 255, 0.9),   /* 윗변에 닿는 빛 */
  inset 0 -1px 1px rgba(255, 255, 255, 0.4),  /* 아랫변 반사광 */
  inset 0 0 22px rgba(255, 255, 255, 0.22);   /* 내부 확산광 */
```

### 윗면 광택

버튼 위쪽 45% 높이에 아래로 사라지는 흰 그라데이션. **과하면 유리가 아니라 플라스틱 버튼처럼 보인다** — 쓰기 전에 한 번 더 판단하고, 빼달라는 요청이 흔하다.

### 가장자리 굴절감

버튼 전체에 깔린 레이어에 **자체 `backdrop-filter`를 한 번 더** 건다. 부모의 블러 결과 위에 추가로 얹히므로 가장자리만 더 두꺼운 유리처럼 보인다. 마스크는 네 변에서 안쪽으로 사라지는 그라데이션 4개를 합집합(`mask-composite: add`)으로 겹쳐 만든다.

```css
.glass-button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(6px) brightness(1.16) saturate(115%);
  -webkit-backdrop-filter: blur(6px) brightness(1.16) saturate(115%);
  -webkit-mask:
    linear-gradient(to right,  #000, transparent 18px),
    linear-gradient(to left,   #000, transparent 18px),
    linear-gradient(to bottom, #000, transparent 14px),
    linear-gradient(to top,    #000, transparent 14px);
  -webkit-mask-composite: source-over;
  mask:
    linear-gradient(to right,  #000, transparent 18px),
    linear-gradient(to left,   #000, transparent 18px),
    linear-gradient(to bottom, #000, transparent 14px),
    linear-gradient(to top,    #000, transparent 14px);
  mask-composite: add;
  pointer-events: none;
}
```

## 레이어가 글자를 가릴 때

`::after`처럼 요소 전체를 덮는 레이어는 텍스트 위에 그려진다. 라벨을 `<span>`으로 감싸고 `position: relative; z-index: 1`을 주면 해결되지만, **레이어를 제거하면 span도 같이 정리한다** — 남겨두면 나중에 혼란을 부른다.

## 테스트 배경 만들기

유리 설정을 검증하려면 뒤 배경이 까다로워야 한다. 도형은 `body::before`가 아니라 **버튼마다 `.stage` 컨테이너를 씌우고 그 `::before`로** 그린다. 그래야 버튼이 늘어나거나 창 크기가 바뀌어도 겹침 비율이 유지된다.

```css
.stage { position: relative; }
.stage::before {
  content: ""; position: absolute;
  top: 50%; left: 50%; z-index: -1;
}

/* 체크 패턴 + 가는 사선 — 디테일이 blur에 어떻게 반응하는지 확인 */
.stage--pattern::before {
  width: 460px; height: 320px;
  transform: translate(-56%, -50%) rotate(-8deg);  /* 기울여야 선 흐트러짐이 보임 */
  background-image:
    repeating-linear-gradient(45deg,
      rgba(255,255,255,0.40) 0 2px, transparent 2px 9px),
    repeating-conic-gradient(
      rgba(94,135,170,0.55) 0% 25%, rgba(255,255,255,0.45) 0% 50%);
  background-size: auto, 34px 34px;
  -webkit-mask: radial-gradient(ellipse at center, #000 42%, transparent 78%);
  mask: radial-gradient(ellipse at center, #000 42%, transparent 78%);
}

/* 단색 원 — 절반만 겹치게 */
.stage--circle::before {
  width: 300px; height: 300px;
  border-radius: 50%;
  background: rgba(122, 160, 190, 0.85);
  transform: translate(-100%, -50%);  /* -100% = 원의 오른쪽 끝이 버튼 정중앙 */
}
```

겹침 비율은 `translate`의 X값으로 조절한다. `-100%`면 도형 오른쪽 끝이 버튼 중앙(절반 겹침), `-78%`면 버튼 대부분을 덮는다.

도형을 크게 잡으면 버튼 높이 구간에서 곡선이 거의 수직선으로 지나간다. **곡선이 버튼을 가로지르는 모습을 보려면 원 지름을 버튼 높이의 2~3배(90~120px)로 줄여야 한다.**

## 브라우저 지원

- `backdrop-filter` — 모든 최신 브라우저. 사파리는 `-webkit-` 접두사 필수
- `mask-composite: exclude / add` — 크롬·사파리·파폭 최신 버전. `-webkit-mask-composite`는 키워드가 달라(`xor`, `source-over`) 두 벌 다 써야 한다
- 안드로이드 저사양 기기에서 `backdrop-filter`는 무겁다. 스크롤·애니메이션과 같이 쓰면 프레임이 떨어진다

## 작업 순서 권장

1. 뒤 배경(그라데이션 + 패턴/도형)부터 깐다
2. 기본 유리 레시피를 올린다
3. blur와 오버레이 값을 **사용자에게 보여주며** 맞춘다 — 값 감각은 화면으로 봐야 정해진다
4. 빛 효과 레이어는 하나씩 추가한다. 한 번에 여러 개 얹으면 어느 게 과한지 구분이 안 된다

빛 효과는 취향을 많이 타서 되돌리는 일이 잦다. 레이어를 독립된 규칙으로 분리해 두면 통째로 지우기 쉽다.

전체 동작 예제: `reference/demo.html`
