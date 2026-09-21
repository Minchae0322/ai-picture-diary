import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Weather } from '@/shared/weather';

/**
 * 04 `AI Artwork (생성 결과)`. 정사각.
 * 그림이 없을 때의 젤리 배치는 시안 좌표(334 기준)를 비율로 옮긴 **자리표시자**다.
 * 실제 그림은 서버가 주는 imageUrl이며, 이 도형을 이미지 대신 쓰지 않는다.
 */
const JELLIES = [
  { size: 110, x: 40, y: 60 },
  { size: 86, x: 150, y: 40 },
  { size: 70, x: 110, y: 170 },
  { size: 60, x: 215, y: 150 },
  { size: 48, x: 60, y: 215 },
] as const;
const FRAME = 334;

type Props = {
  imageUrl: string | null;
  weather: Weather | null;
  /** 이미지 실패 시 보여줄 안내와 함께 둘 행동 */
  fallbackAction?: ReactNode;
};

export function DiaryArtwork({ imageUrl, weather, fallbackAction }: Props) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl !== null && !failed;
  const tints = [
    weather === null ? colors.accentSoft : weatherColor[weather],
    colors.accentSoft,
    weatherColor.SUNNY,
    weatherColor.PARTLY_CLOUDY,
    colors.primary,
  ];

  return (
    <View style={[styles.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          onError={() => setFailed(true)}
          accessibilityLabel="오늘의 AI 그림"
        />
      ) : (
        <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no">
          {JELLIES.map((jelly, index) => (
            <View
              key={`${jelly.x}-${jelly.y}`}
              style={{
                position: 'absolute',
                left: `${(jelly.x / FRAME) * 100}%`,
                top: `${(jelly.y / FRAME) * 100}%`,
                width: `${(jelly.size / FRAME) * 100}%`,
                aspectRatio: 1,
                borderRadius: radius.full,
                backgroundColor: tints[index],
                opacity: 0.85,
              }}
            />
          ))}
        </View>
      )}

      {showImage ? null : (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackText, { color: colors.textMuted }]}>
            {imageUrl === null ? '그림을 만들지 못했어요' : '그림을 불러오지 못했어요'}
          </Text>
          {fallbackAction}
        </View>
      )}

      {/* 생성물 고지. 이 표기는 제거 대상이 아니다(프로젝트 스킬 5장) */}
      <View style={[styles.tag, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
        <Text style={[styles.tagText, { color: colors.textMuted }]}>AI generated</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3], padding: space[6] },
  fallbackText: { fontSize: font.base, lineHeight: leading(font.base) },
  tag: {
    position: 'absolute',
    left: space[4],
    top: space[4],
    paddingHorizontal: space[3],
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  tagText: { fontSize: font.xs, fontWeight: font.weightMedium },
});
