import { Image, StyleSheet, View } from 'react-native';
import onboardingArt from '@assets/images/onboarding.png';

/**
 * 01 온보딩의 히어로. 투명 배경 PNG라 하늘 그라디언트 위에 그대로 얹힌다.
 *
 * 원본 2048x2048 안에서 실제 그림은 x 381~1739, y 317~1589이다(알파 경계 상자를 재서 나온 값).
 * 가로의 34%가 투명 여백이고 중심도 정중앙에서 오른쪽 36px 치우쳐 있어서,
 * PNG를 그냥 가운데 두면 그림은 가운데로 오지 않는다.
 *
 * 그래서 **그림 영역을 레이아웃 박스로 삼고** 그 안에 원본을 밀어 넣는다.
 * 박스 밖(투명 여백)은 잘리지만 보이는 것은 하나도 잘리지 않고 중앙 정렬이 정확해진다.
 *
 * 값은 `docs/screen/prototype.html` 의 `.hero-art` 와 같다. 한쪽만 고치지 않는다.
 * 원본 그림을 바꾸면 경계 상자 네 값을 다시 재야 한다.
 */

/** 그림의 표시 가로. 이 값만 바꾸면 나머지가 따라온다 */
const ART_WIDTH = 280;

/** 원본 한 변 */
const SOURCE = 2048;
/** 그림 경계 상자: 좌상단과 크기 */
const BOX = { x: 381, y: 317, width: 1359, height: 1273 } as const;

const scale = ART_WIDTH / BOX.width;

export function OnboardingHero() {
  return (
    <View
      style={styles.frame}
      accessibilityRole="image"
      accessibilityLabel="AI Diary"
    >
      <Image source={onboardingArt} style={styles.art} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: ART_WIDTH,
    height: BOX.height * scale,
    overflow: 'hidden',
  },
  art: {
    position: 'absolute',
    width: SOURCE * scale,
    height: SOURCE * scale,
    left: -BOX.x * scale,
    top: -BOX.y * scale,
  },
});
