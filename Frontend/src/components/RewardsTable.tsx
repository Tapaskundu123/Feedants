import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';
import { Reward } from '../types';

interface Props {
  rewards: Reward[];
  disclaimer?: string;
}

const POSITION_ICONS: Record<number, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  1: { name: 'trophy', color: '#F5A623' },
  2: { name: 'trophy', color: '#9B9B9B' },
  3: { name: 'trophy', color: '#CD7F32' },
  4: { name: 'star-outline', color: COLORS.textMuted },
  5: { name: 'star-outline', color: COLORS.textMuted },
  6: { name: 'star-outline', color: COLORS.textMuted },
};

export const RewardsTable: React.FC<Props> = ({ rewards, disclaimer }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Rewards</Text>
        <Text style={styles.allPositions}>(All Positions)</Text>
      </View>

      {rewards.map((reward) => {
        const icon = POSITION_ICONS[reward.position] || {
          name: 'star-outline' as keyof typeof Ionicons.glyphMap,
          color: COLORS.textMuted,
        };
        return (
          <View key={reward.position} style={styles.row}>
            <View style={styles.leftCol}>
              <Ionicons name={icon.name} size={20} color={icon.color} />
              <Text style={styles.label}>{reward.label}</Text>
            </View>
            <Text style={styles.amount}>₹ {reward.amount.toLocaleString('en-IN')}</Text>
          </View>
        );
      })}

      {disclaimer && (
        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Disclaimer: </Text>
            {disclaimer}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  allPositions: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  amount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  disclaimerRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  disclaimerBold: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});
