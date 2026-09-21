import { StyleSheet, Text, View } from 'react-native';
import { font, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL, type Weather } from '@/shared/weather';

/** 시안 04 `weather`, 08 `w`: 점 + 라벨. 점만 두지 않는다 */
export function WeatherTag({ weather, trailing }: { weather: Weather; trailing?: string }) {
  const colors = useColors();
  const label = trailing === undefined ? WEATHER_LABEL[weather] : `${WEATHER_LABEL[weather]} · ${trailing}`;
  return (
    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: weatherColor[weather] }]} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[2],
    paddingLeft: 14,
    paddingRight: space[4],
    paddingVertical: space[2],
    borderWidth: 1.5,
    borderRadius: radius.full,
  },
  dot: { width: 14, height: 14, borderRadius: radius.full },
  label: { fontSize: font.base, fontWeight: font.weightBold },
});
