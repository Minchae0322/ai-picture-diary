---
name: frontend-architecture
description: 프론트엔드 코드를 새로 쓰거나 구조를 잡거나 리뷰할 때 자동 적용. "컴포넌트 만들어", "폴더 구조", "훅으로 빼", "props", "타입 정의", "리팩터링", "파일 어디에 둬" 요청이나 .tsx/.vue 파일이 새로 생기는 순간 트리거. feature 기준 폴더 구조, 컴포넌트 분리 기준, props/이벤트 규칙, 훅/컴포저블 추출 기준, 네이밍, TypeScript 규칙. 기본 스택은 React 19 + TypeScript + Vite, Vue 3는 차이 나는 지점만 병기.
---

# 프론트엔드 구조와 코딩 컨벤션 (frontend-architecture)

## 목적

"이 코드를 어디에, 어떤 크기로, 어떤 이름으로 둘 것인가"를 매번 정하지 않기 위한 기본값. 화면이 커져도 파일을 찾을 수 있고, 컴포넌트가 커지기 전에 나눌 기준이 있고, 타입이 API 계약을 지키게 만든다.

기본 스택(2026-09 확인): **React 19.2 + TypeScript + Vite**, React Compiler 1.0 안정. 회사 프로젝트는 Vue 3 - 차이 나는 지점은 `(Vue)` 표기. 프레임워크 선택은 프로젝트 `CLAUDE.md`에 적힌 것이 우선.

## 언제 적용

새 화면/컴포넌트/훅 작성, 폴더 구조 결정, 컴포넌트가 커져서 나눌 때, 타입 정의, PR 리뷰.

> **React Native / Expo라면** 이 스킬을 먼저 읽고, `expo-app-conventions`에서 달라지는 절만 덮어쓴다. 순서를 뒤집지 않는다.

## 1. 폴더 구조 - feature 기준

```
src/
├── app/            # 진입점, 라우터, 전역 프로바이더, 전역 스타일
├── features/       # 업무 단위. 백엔드 도메인 패키지와 이름을 맞춘다
│   └── article/
│       ├── api/          # 이 feature의 API 호출 함수와 타입
│       ├── components/   # 이 feature 안에서만 쓰는 컴포넌트
│       ├── hooks/        # (Vue: composables/)
│       ├── model/        # 타입, 상수, 순수 함수(도메인 규칙)
│       └── index.ts      # 밖으로 내보낼 것만. 이 파일이 feature의 공개 API
├── shared/         # feature와 무관한 것: ui 컴포넌트, 공용 훅, 유틸, api 클라이언트
│   ├── ui/
│   ├── hooks/
│   ├── lib/
│   └── api/
└── pages/          # 라우트 1개 = 파일 1개. features를 조합만 하고 로직 없음
```

- **feature 이름 = 백엔드 도메인 패키지 이름.** `article`, `member`, `order`. 양쪽이 같은 말을 써야 API 연동과 문서가 맞물린다(`ddd-spring`).
- feature끼리 직접 import하지 않는다. 필요하면 `index.ts`를 통해서만, 순환이 생기면 `shared/`로 내리거나 상위 feature를 만든다.
- `shared/`에 넣기 전에 **두 feature 이상에서 실제로 쓰는지** 확인한다. "나중에 쓸 것 같아서"는 feature 안에 둔다.
- 타입/컴포넌트/유틸 같은 **종류별 최상위 폴더(`components/`, `utils/`, `types/`)를 만들지 않는다.** 화면이 30개를 넘으면 찾을 수 없다.

## 2. 컴포넌트 분리 기준

- 하나의 컴포넌트는 **한 가지 이유로만 바뀐다.** 데이터를 가져오는 이유와 그리는 이유가 다르면 나눈다.
- 나누는 신호: 파일 150줄 초과, `useState`/`ref`가 5개 이상, JSX/템플릿에 3중 이상 중첩된 조건, 같은 JSX 덩어리가 두 번 등장, props가 8개 이상.
- 계층은 셋으로 본다: **페이지**(라우트, 조합만) -> **feature 컴포넌트**(데이터 + 상태 + 조합) -> **UI 컴포넌트**(props만 받아 그림, 데이터 소스 모름).
- UI 컴포넌트(`shared/ui/`)는 서버 데이터·라우터·전역 상태를 **모른다.** props와 이벤트만. 그래야 어디서든 재사용되고 테스트가 쉽다.
- 조기 추상화 금지. 두 번째 사용처가 나타나기 전에 공용 컴포넌트를 만들지 않는다. 세 번째에서 추상화한다.
- 조건부 렌더링이 복잡하면 컴포넌트를 나누지 말고 **조기 반환(early return)** 을 먼저 시도한다.

## 3. props와 이벤트

- props는 **데이터 내려주기, 이벤트로 올리기.** 자식이 부모 상태를 직접 바꾸지 않는다. (Vue: `props` + `emit`, `v-model`은 단순 값에만)
- 불리언 props 폭발 금지. `isPrimary`, `isLarge`, `isOutline`이 쌓이면 `variant`, `size` 같은 **열거형 props**로 바꾼다(`design-system` 5장).
- 객체 통째로 넘기지 않는다. `<Card article={article}>` 대신 필요한 필드만. 컴포넌트가 데이터 모양에 결합되면 API가 바뀔 때 전부 깨진다. 예외: 필드 대부분을 쓰는 feature 컴포넌트.
- 이벤트 이름은 `on<동사>`: `onSubmit`, `onSelect`, `onClose`. (Vue: `submit`, `select`, `close` - 접두사 없이)
- 콜백 props에 이벤트 객체가 아니라 **의미 있는 값**을 넘긴다: `onSelect(articleId)` (O), `onSelect(event)` (X).
- `children`/슬롯은 레이아웃 컴포넌트에. 데이터 컴포넌트가 슬롯을 여러 개 받으면 역할이 섞인 것.

## 4. 훅 / 컴포저블 추출

- 추출 기준: 상태 + 그 상태를 바꾸는 로직이 **한 덩어리로 다른 곳에서도 쓰이거나**, 컴포넌트가 2장의 신호를 넘었을 때.
- 이름은 `use<무엇>`: `useArticleForm`, `usePagination`. 동사형(`useFetchArticle`)보다 명사형.
- 훅 하나 = 관심사 하나. `useArticlePage`처럼 화면 전체를 담는 훅은 컴포넌트를 옮겨놓은 것일 뿐이다.
- 반환은 **객체**로(`{ articles, isLoading, refetch }`). 튜플은 `useState`처럼 두 개짜리에만.
- 서버 데이터 훅은 `frontend-state` 스킬의 규칙(TanStack Query)을 따른다. 훅 안에서 `fetch`를 직접 호출하지 않는다.
- (Vue) 컴포저블은 `ref`/`computed`를 반환하고 `.value` 언래핑을 호출자에게 맡긴다. `reactive` 객체 반환은 구조분해 시 반응성이 끊긴다.

## 5. 네이밍

| 대상 | 규칙 | 예 |
|---|---|---|
| 컴포넌트 파일/이름 | PascalCase, 명사, 두 단어 이상 | `ArticleCard.tsx`, `ArticleCard.vue` |
| 훅/컴포저블 | `use` + PascalCase | `useArticleList.ts` |
| 일반 모듈 | camelCase | `formatDate.ts`, `articleApi.ts` |
| 타입/인터페이스 | PascalCase, `I`/`T` 접두사 없음 | `Article`, `ArticleSummary` |
| 상수 | UPPER_SNAKE | `MAX_TITLE_LENGTH` |
| 불리언 | `is`/`has`/`can` | `isOpen`, `hasError` |
| 이벤트 핸들러 | `handle<무엇>` (내부), `on<무엇>` (props) | `handleSubmit`, `onSubmit` |
| feature 폴더 | kebab-case 단수 | `article`, `order-line` |

- 한 단어 컴포넌트 이름(`Card`, `List`)은 `shared/ui/`에서만. feature 컴포넌트는 도메인 접두사(`ArticleCard`).
- 파일 하나에 컴포넌트 하나. 작은 보조 컴포넌트는 같은 파일에 둬도 되지만 export하지 않는다.

## 6. TypeScript

- `strict: true`. `any` 금지, 정말 모르면 `unknown` 후 좁힌다.
- **API 타입은 API 계층에서 한 번만 정의**하고(`frontend-api-client`) 컴포넌트는 그것을 import한다. 컴포넌트마다 비슷한 타입을 다시 만들지 않는다.
- 서버 응답 타입과 화면 모델을 구분한다. 화면이 서버 필드명에 결합되면 안 될 때만 변환 계층을 둔다. 대부분은 그대로 써도 된다.
- props 타입은 `interface`가 아니라 `type`이어도 된다. 하나로 통일만. 확장이 잦으면 `interface`.
- enum 대신 **문자열 리터럴 유니온** (`type Status = 'DRAFT' | 'PUBLISHED'`). 서버 enum(`db-schema-and-migration` 3장)과 값을 맞추고, 모르는 값이 와도 깨지지 않게 `string`으로 넓히는 폴백을 둔다.
- 함수 반환 타입은 공개 API(훅, 유틸)에만 명시. 컴포넌트 내부는 추론에 맡긴다.
- `as` 단언은 테스트와 타입 가드 안에서만. 컴포넌트 코드의 `as`는 대부분 타입 설계가 틀린 신호.

## 7. 리뷰 체크

- 파일이 종류별 폴더가 아니라 feature 아래에 있는가, feature 간 직접 import가 없는가
- 컴포넌트가 150줄/상태 5개/props 8개를 넘지 않는가
- UI 컴포넌트가 서버 데이터·라우터·전역 상태를 모르는가
- 불리언 props가 쌓여 있지 않은가, 콜백이 의미 있는 값을 넘기는가
- `any`, 컴포넌트 안 `as`, 중복 타입 정의가 없는가
- 훅이 관심사 하나인가, 서버 호출을 직접 하지 않는가

## 하지 말 것

- `components/`, `utils/`, `types/` 종류별 최상위 폴더
- feature끼리 직접 import, 순환 참조
- 두 번째 사용처 없이 공용 컴포넌트 만들기
- 객체 통째로 props 넘기기, 불리언 props 5개
- 화면 전체를 담는 거대 훅
- `any`, `as` 남발, 컴포넌트마다 타입 재정의
- 페이지 컴포넌트에 비즈니스 로직

## 관련 스킬

`frontend-state`(상태 위치 결정), `frontend-api-client`(API 계층과 타입), `ui-fundamentals`/`design-system`(스타일), `figma-workflow`(시안에서 가져온 코드를 이 규칙으로 옮긴다), `ddd-spring`(feature 이름 = 도메인 패키지), `test-writing-guide`(테스트 원칙은 공통).

## 더 보기

`reference.md` - 폴더 구조 실제 예시, 컴포넌트 분리 전후 코드, props 열거형 변환 예, 훅 추출 예, Vue 대응표(React 개념 -> Vue 개념), tsconfig 권장, 참고 링크.
