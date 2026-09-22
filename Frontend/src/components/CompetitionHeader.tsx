import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';
import { Competition } from '../types';

interface Props {
  competition: Competition;
  isRegistered: boolean;
  onBack: () => void;
}

export const CompetitionHeader: React.FC<Props> = ({
  competition,
  isRegistered,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
        <View style={styles.langRow}>
          <TouchableOpacity style={styles.langActive}>
            <Text style={styles.langActiveText}>ENG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.langInactive}>
            <Text style={styles.langInactiveText}>हिंदी</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {competition.title}
        </Text>
        {isRegistered && (
          <View style={styles.registeredBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
            <Text style={styles.registeredText}>Registered</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{competition.category}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{competition.type}</Text>
        </View>
        {competition.hasCertificate && (
          <View style={styles.certTag}>
            <Ionicons name="ribbon-outline" size={13} color={COLORS.primary} />
            <Text style={styles.certText}>Winners get certificate</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  langActive: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  langActiveText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  langInactive: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  langInactiveText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  registeredText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  certText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
