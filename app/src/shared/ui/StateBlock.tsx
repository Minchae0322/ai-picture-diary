import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from '@/shared/ui/Button';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Muted } from '@/shared/ui/Type';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Emotion } from '@/shared/emotion';

/**
 * 로딩 / 빈 / 에러. 시안에 없는 세 상태를 화면마다 다시 발명하지 않게 한 곳에 모은다
 * (ui-fundamentals 13장, figma-workflow 3장).
 *
 * **빈 화면은 글자만 두지 않는다.** 이 제품의 얼굴은 감정 캐릭터라, 아무것도 없는 화면이야말로
 * 캐릭터가 설 자리다. 그림 -> 제목 -> 한 줄 안내 -> 할 일 순으로 쌓는다.
 */
export function Loading({ label = '불러오는 중' }: { label?: string }) {
  const colors = useColors();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

type EmptyProps = {
  /** 굵은 한 줄. 없으면 `message` 가 그 자리를 대신한다 */
  title?: string;
  message: string;
  /**
   * 세울 캐릭터. 상황에 맞는 것을 고른다 - 비었다고 아무 얼굴이나 두면 뜻이 어긋난다.
   * 필터 결과가 비었을 때는 **필터로 고른 그 감정**을 넘기는 쪽이 좋다.
   */
  face?: Emotion;
  action?: { label: string; onPress: () => void };
  /**
   * `page`   목록·화면 전체가 비었을 때. 가운데 정렬 + 큰 그림
   * `inline` 카드 한 칸이 비었을 때. 왼쪽 정렬 + 작은 그림. 카드 안에서는 큰 그림이 과하다
   */
  variant?: 'page' | 'inline';
};

export function Empty({ title, message, face = 'SOSO', action, variant = 'page' }: EmptyProps) {
  const colors = useColors();

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <View style={[styles.inlineArt, { backgroundColor: colors.faceBg }]}>
          <EmotionFace emotion={face} size={28} />
        </View>
        <View style={styles.inlineText}>
          {title ? (
            <Text style={[styles.inlineTitle, { color: colors.text }]}>{title}</Text>
          ) : null}
          <Muted>{message}</Muted>
          {action ? (
            <Button label={action.label} size="small" variant="soft" onPress={action.onPress} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={[styles.pageArt, { backgroundColor: colors.faceBg }]}>
        <EmotionFace emotion={face} size={76} />
      </View>
      <Text style={[styles.pageTitle, { color: colors.text }]}>{title ?? message}</Text>
      {title ? <Text style={[styles.pageMessage, { color: colors.textMuted }]}>{message}</Text> : null}
      {action ? (
        <View style={styles.pageAction}>
          <Button label={action.label} size="medium" variant="soft" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

/** 당황한 당근이 선다. 실패 화면에 웃는 얼굴을 두지 않는다. */
export function ErrorRetry({
  error,
  onRetry,
  variant = 'page',
}: {
  error: unknown;
  onRetry: () => void;
  variant?: 'page' | 'inline';
}) {
  const message = error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.';
  return (
    <Empty
      title="불러오지 못했어요"
      message={message}
      face="EMBARRASSED"
      variant={variant}
      action={{ label: '다시 시도', onPress: onRetry }}
    />
  );
}

/** 목록·그리드의 골격. 개수는 실제 화면과 같게 준다 - 레이아웃이 튀지 않는다. */
export function Skeleton({ height, count = 1 }: { height: number; count?: number }) {
  const colors = useColors();
  return (
    <View
      style={styles.skeletonWrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.skeleton, { height, backgroundColor: colors.skeleton }]} />
      ))}
    </View>
  );
}

/** 캐릭터가 얹히는 동그란 면. 지름은 `size` 보다 넉넉해야 한다 - 배율 때문에 변이 커진다 */
const art = (diameter: number) => ({
  width: diameter,
  height: diameter,
  borderRadius: radius.full,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  overflow: 'hidden' as const,
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: space[6] },

  page: { alignItems: 'center', paddingVertical: space[12], gap: space[3] },
  pageArt: art(128),
  pageTitle: {
    fontSize: font.lg,
    fontFamily: font.bold,
    lineHeight: leading(font.lg, 1.3),
    textAlign: 'center',
  },
  pageMessage: {
    fontSize: font.base,
    fontFamily: font.regular,
    lineHeight: leading(font.base),
    textAlign: 'center',
    maxWidth: 260,
  },
  pageAction: { paddingTop: space[2] },

  inline: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  inlineArt: art(48),
  inlineText: { flex: 1, gap: space[2], alignItems: 'flex-start' },
  inlineTitle: { fontSize: font.md, fontFamily: font.bold, lineHeight: leading(font.md, 1.3) },

  skeletonWrap: { gap: space[3] },
  skeleton: { borderRadius: radius.lg },
});
