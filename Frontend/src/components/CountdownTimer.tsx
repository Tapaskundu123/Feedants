import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';
import { useCountdown } from '../hooks/useCountdown';

interface Props {
  targetDate: string;
  label?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const CountdownTimer: React.FC<Props> = ({
  targetDate,
  label = 'Registration closes in',
}) => {
  const { days, hours, minutes, seconds, total } = useCountdown(targetDate);
  const expired = total <= 0;

  if (expired) {
    return (
      <View style={[styles.banner, styles.bannerExpired]}>
        <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.labelExpired}>Registration Closed</Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="hourglass-outline" size={18} color={COLORS.timerText} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.countdown}>
        {pad(days)}d : {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
      </Text>
      <View style={styles.hurryBadge}>
        <Ionicons name="flash" size={11} color={COLORS.warning} />
        <Text style={styles.hurryText}>Hurry up!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.timerBg,
    borderWidth: 1,
    borderColor: COLORS.timerBorder,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  bannerExpired: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  labelExpired: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  countdown: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.timerText,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  hurryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  hurryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});
