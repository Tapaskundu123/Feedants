import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';
import { CompetitionDates } from '../types';

interface Props {
  dates: CompetitionDates;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  const time = d.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date: `${day} ${month} ${year}`, time };
};

interface DateCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iso: string;
}

const DateCard: React.FC<DateCardProps> = ({ icon, label, iso }) => {
  const { date, time } = formatDate(iso);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
      <Text style={styles.cardDate}>{date}</Text>
      <Text style={styles.cardTime}>{time}</Text>
    </View>
  );
};

export const ImportantDates: React.FC<Props> = ({ dates }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Important Dates</Text>
      <View style={styles.grid}>
        <DateCard
          icon="calendar-outline"
          label="Register Before"
          iso={dates.registrationClose}
        />
        <DateCard
          icon="paper-plane-outline"
          label="Submission Starts"
          iso={dates.submissionStart}
        />
        <DateCard
          icon="cloud-upload-outline"
          label="Submission Ends"
          iso={dates.submissionEnd}
        />
        <DateCard
          icon="trophy-outline"
          label="Result Date"
          iso={dates.resultDate}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  cardDate: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  cardTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
