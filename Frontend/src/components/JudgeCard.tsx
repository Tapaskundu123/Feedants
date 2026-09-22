import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { Judge } from '../types';

interface Props {
  judge: Judge;
}

export const JudgeCard: React.FC<Props> = ({ judge }) => {
  const handleIntroVideo = () => {
    if (judge.introVideoUrl) {
      Linking.openURL(judge.introVideoUrl);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <Image
          source={{ uri: judge.photoUrl || 'https://randomuser.me/api/portraits/women/44.jpg' }}
          style={styles.photo}
          defaultSource={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
        />
        <View style={styles.info}>
          <Text style={styles.judgeLabel}>Judge</Text>
          <Text style={styles.judgeName}>{judge.name}</Text>
          <Text style={styles.judgeTitle}>{judge.title}</Text>
          <Text style={styles.judgeExp}>{judge.experience}</Text>
        </View>
      </View>

      {judge.introVideoUrl ? (
        <TouchableOpacity style={styles.videoBtn} onPress={handleIntroVideo} activeOpacity={0.8}>
          <View style={styles.videoCircle}>
            <Ionicons name="play" size={16} color={COLORS.white} />
          </View>
          <Text style={styles.videoLabel}>Intro Video</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryMuted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  judgeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  judgeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  judgeTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  judgeExp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  videoBtn: {
    alignItems: 'center',
    gap: 4,
  },
  videoCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
