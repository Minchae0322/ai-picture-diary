/**
 * 번들러가 처리하는 자산의 타입. `import art from '@assets/images/bottom.png'` 를 쓰기 위해 둔다.
 *
 * SVG 선언은 두지 않는다 - 아이콘은 `src/shared/ui/Icon.tsx` 가 코드로 그린다.
 * 파일을 import 하지 않으니 svg transformer 도 metro 설정도 필요 없다.
 */
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}
