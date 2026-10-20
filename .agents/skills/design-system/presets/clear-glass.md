# 프리셋: Clear Glass (완전 투명 유리)

## 성격

**채움이 0이다.** 판 전체를 흐리지 않고 가장자리 띠에서만 배경을 굴절시킨다. 가운데는 배경이 그대로 통과한다. `glass-depth`가 젖빛 유리라면 이것은 맑은 유리다.

형태를 만드는 것은 세 겹뿐이다.

| 겹 | 역할 |
|---|---|
| 굴절 띠 | 유리의 두께. 테두리 안쪽 밴드에만 `backdrop-filter` |
| 모서리 링 | 윤곽. 위·아래 모서리가 **둘 다** 빛난다 |
| 정반사 스윕 | 표면. 비스듬한 빛줄기 |

## 쓸 수 있는 조건 - 셋 다 만족해야 한다

1. **배경이 어둡다.** 유리가 배경을 밝히지 않으므로 글자는 배경 위에 직접 놓인 것과 같다. 밝은 배경이면 흰 글자가 즉시 무너진다.
2. **배경이 고정이다.** 사용자 업로드 이미지나 바뀌는 영상 위에서는 대비를 보장할 수 없다.
3. **배경에 볼 것이 있다.** 매끈한 그라디언트 뒤에서는 투명해도 투명해 보이지 않는다. 격자, 형태가 선명한 오브젝트, 사진이 있어야 유리로 읽힌다.

하나라도 안 맞으면 `glass-depth`(채움 `.10` 이상)로 간다. 긴 본문·입력 화면은 어느 쪽도 쓰지 않는다.

## 1. 토큰

**굴절 값은 전부 변수로 둔다.** 요소마다 손으로 적으면 카드와 버튼이 다른 재질로 보인다(6장).

```css
:root{
  --bg-base:#150c2c;

  --glass-a:0;        /* 채움 없음 */
  --rim:8px;          /* 굴절 띠 폭 - 높이의 20% 이하 */
  --rim-blur:9px;     /* 굴절 세기 */
  --rim-sat:200%;
  --rim-bright:1.12;
  --sheen-deg:112deg;
  --pane-blur:.5px;   /* 판은 거의 통과시킨다 */
  --sat:150%;

  --edge-hi:rgb(255 255 255 / .95);
  --edge-mid:rgb(255 255 255 / .28);
  --edge-lo:rgb(255 255 255 / .06);

  --sh-contact:0 1px 2px rgb(8 3 24 / .55);
  --sh-mid:0 10px 24px -10px rgb(8 3 24 / .5);
  --sh-ambient:0 34px 70px -20px rgb(8 3 24 / .65);

  --text-sh:0 1px 3px rgb(8 3 24 / .7),0 0 12px rgb(8 3 24 / .4);
}
```

색 토큰은 `glass-depth`와 같다. 이 프리셋이 다른 것은 **표면 처리**뿐이다.

## 2. 구현 - 가장자리 굴절

판 전체에 `backdrop-filter`를 걸면 아무리 투명해도 젖빛이 된다. 띠에만 건다.

```css
.glass{
  position:relative; isolation:isolate;
  background:rgb(255 255 255 / var(--glass-a));
  backdrop-filter:blur(var(--pane-blur)) saturate(var(--sat));
  -webkit-backdrop-filter:blur(var(--pane-blur)) saturate(var(--sat));
  box-shadow:var(--sh-contact),var(--sh-mid),var(--sh-ambient);
  color:#fff; text-shadow:var(--text-sh);
}

/* 굴절 띠 - 가운데를 파내고 테두리 안쪽에만 적용 */
.glass::before{
  content:''; position:absolute; inset:0; border-radius:inherit;
  padding:var(--rim); z-index:-1; pointer-events:none;
  backdrop-filter:blur(var(--rim-blur)) saturate(var(--rim-sat)) brightness(var(--rim-bright));
  -webkit-backdrop-filter:blur(var(--rim-blur)) saturate(var(--rim-sat)) brightness(var(--rim-bright));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude;
}

/* 모서리 링 - 양끝을 둘 다 밝게. 실제 유리는 위아래가 같이 빛난다 */
.glass::after{
  content:''; position:absolute; inset:0; border-radius:inherit;
  padding:1px; pointer-events:none;
  background:linear-gradient(145deg,var(--edge-hi) 0%,var(--edge-mid) 30%,
             var(--edge-lo) 50%,var(--edge-mid) 78%,var(--edge-hi) 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude;
}

/* 정반사 스윕 - ::before/::after를 이미 썼으므로 자식 요소로 */
.glass > .sheen{
  position:absolute; inset:0; border-radius:inherit; z-index:-1; pointer-events:none;
  background:linear-gradient(var(--sheen-deg),rgb(255 255 255 / .28) 0%,
             rgb(255 255 255 / .06) 22%,transparent 42%);
}
```

`::before`/`::after`를 굴절과 링이 이미 쓴다. 스윕은 **자식 요소**가 필요하다. 이 제약을 잊으면 세 겹 중 하나가 사라진다.

## 3. 버튼

크기 체계는 `design-system` 5.5장(TDS 네이밍)을 그대로 쓴다. **굴절 띠 폭을 크기에 비례시킨다** - 작은 버튼에 넓은 띠를 주면 띠끼리 만나 가운데가 사라진다.

| 크기 | 높이 | 패딩 | 글자 | 라운드 | `--rim` | 맑은 가운데 |
|---|---|---|---|---|---|---|
| `small` | 32 | 12 | 13 | 10 | 6 | 20px (63%) |
| `medium` | 40 | 16 | 14 | 12 | 8 | 24px (60%) |
| `large` | 48 | 20 | 15 | 14 | 10 | 28px (58%) |
| `xlarge` | 56 | 24 | 16 | 16 | 11 | 34px (61%) |

**띠 폭은 짧은 변의 20%를 넘기지 않는다.** 띠는 위아래 양쪽에 생기므로 20%면 40%를 먹고 60%가 남는다. 25%로 잡으면 절반이 띠가 되어 맑은 가운데가 사라지고, 그 순간 `glass-depth`와 구분이 안 된다.

이 규칙이 **카드와 버튼이 다른 재질로 보이는 가장 큰 원인**이다. 카드는 높이가 커서 같은 띠 폭이라도 대부분이 맑게 남지만, 버튼은 띠끼리 거의 맞닿는다. 요소마다 높이에 비례해 정한다.

변형:

- `fill` - **불투명 솔리드.** 1순위 행동은 유리로 만들지 않는다. 투명한 버튼은 "누를 수 있음"이 약하다.
- `weak` - 유리. 보조 행동
- 색유리 - 채움 대신 `rgb(...)/.10` 이하의 옅은 색조만

## 4. 대비

투명할수록 **대비는 오히려 좋아진다** - 유리가 배경을 밝히지 않기 때문이다. 어두운 배경에서 잰 값:

| 채움 | 흰 글자 (배경 최악 지점) |
|---|---|
| `.14` | 5.39:1 |
| `.06` | 6.41:1 |
| `0` | 7.25:1 |

밝은 배경이면 정확히 반대로 간다. **배경의 가장 밝은 지점에서 재고, 거기서 4.5:1을 못 넘기면 이 프리셋을 쓰지 않는다.**

글자에는 `text-shadow` 두 겹(진한 1px + 넓게 퍼지는 12px)이 필수다. 채움이 없어 글자가 배경 위에 직접 놓이므로, 밝은 오브젝트를 지날 때 이것이 없으면 읽히지 않는다.

## 5. 폴백

```css
@supports not (backdrop-filter:blur(1px)){
  .glass{background:rgb(42 29 82 / .85)}
}
@media (prefers-reduced-transparency:reduce){
  .glass{background:#2a1d52; text-shadow:none}
  .glass::before{display:none}
}
```

`backdrop-filter`가 없으면 이 프리셋은 **아무것도 아닌 투명한 상자**가 된다. `glass-depth`보다 폴백이 더 중요하다.

## 6. 이 프리셋에서 하지 말 것

- 판 전체에 `blur`를 5px 넘게 걸기. 그 순간 맑은 유리가 아니다
- 띠 폭을 높이의 1/4 초과로 주기
- 밝은 배경, 바뀌는 배경(업로드 이미지·영상) 위에 쓰기
- 1순위 행동을 유리 버튼으로 만들기
- **유리 안에 유리 넣기.** `backdrop-filter`가 걸린 요소 안에서 또 `backdrop-filter`를 쓰면 안쪽은 부모가 이미 필터한 결과를 한 번 더 필터한다. **같은 값을 줘도 더 탁해진다.** 안쪽 요소는 굴절을 끄고 옅은 채움으로 대신한다:
  ```css
  .glass .glass{ backdrop-filter:none; background:rgb(255 255 255 / .10) }
  .glass .glass::before{ display:none }   /* 굴절 띠 제거 */
  ```
- 굴절 값(`--rim-blur`, `--rim-sat`, `--rim-bright`, `--sheen-deg`)을 요소마다 직접 적기. 한 곳만 어긋나도 재질이 달라 보인다
- 긴 본문·폼 화면에 쓰기
- 글자 `text-shadow` 생략
- 스크롤되는 목록의 모든 행에 굴절 띠 적용. `backdrop-filter`는 GPU 비용이 크다. 컨테이너 한 겹에만
