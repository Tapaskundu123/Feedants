import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';
import { Competition } from '../types';

interface Props {
  competition: Competition;
}

export const PrizeEntryRow: React.FC<Props> = ({ competition }) => {
  const { prizePool, entryFee, totalSpots, bookedSpots, remainingSpots } = competition;
  const progress = bookedSpots / totalSpots;
  const isCritical = remainingSpots <= 5;

  return (
    <View style={styles.container}>
      <View style={styles.leftBlock}>
        {/* Prize Pool */}
        <View style={styles.block}>
          <Text style={styles.label}>Prize Pool</Text>
          <Text style={styles.prizeValue}>
            ₹ {prizePool.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Entry Fee */}
        <View style={styles.block}>
          <Text style={styles.label}>Entry Fee</Text>
          <Text style={styles.feeValue}>
            ₹ {entryFee.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Spots */}
      <View style={styles.spotsBlock}>
        <View style={styles.spotsHeader}>
          <Text style={[styles.spotsLabel, isCritical && styles.spotsLabelCritical]}>
            {isCritical ? `⚡ Only ${remainingSpots} spots left` : `${remainingSpots} spots left`}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` },
              isCritical && styles.progressFillCritical,
            ]}
          />
        </View>
        <Text style={styles.spotsCount}>
          {bookedSpots} / {totalSpots} Booked
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  block: {
    gap: 3,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  prizeValue: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  feeValue: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  spotsBlock: {
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
    marginLeft: SPACING.md,
  },
  spotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  spotsLabelCritical: {
    color: COLORS.error,
  },
  progressBg: {
    width: '100%',
    height: 5,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressFillCritical: {
    backgroundColor: COLORS.error,
  },
  spotsCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});
