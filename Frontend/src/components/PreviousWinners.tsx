import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { PreviousWinner } from '../types';

interface Props {
  winners: PreviousWinner[];
}

const RANK_COLORS: Record<string, string> = {
  '1st Winner': '#F5A623',
  '2nd Winner': '#9B9B9B',
  '3rd Winner': '#CD7F32',
};

const WinnerCard: React.FC<{ winner: PreviousWinner }> = ({ winner }) => {
  const rankColor = RANK_COLORS[winner.rank] || COLORS.textMuted;

  const handleVideo = () => {
    if (winner.videoUrl) Linking.openURL(winner.videoUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: winner.photoUrl }}
          style={styles.photo}
          defaultSource={{ uri: 'https://randomuser.me/api/portraits/women/32.jpg' }}
        />
        <View style={styles.imageOverlay} />
        <TouchableOpacity style={styles.playBtn} onPress={handleVideo} activeOpacity={0.8}>
          <Ionicons name="play-circle" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.winnerName} numberOfLines={1}>
        {winner.name}
      </Text>
      <Text style={[styles.winnerRank, { color: rankColor }]}>{winner.rank}</Text>
    </View>
  );
};

export const PreviousWinners: React.FC<Props> = ({ winners }) => {
  if (!winners || winners.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Previous Winners</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {winners.map((winner, idx) => (
          <WinnerCard key={idx} winner={winner} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  card: {
    width: 100,
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    width: 90,
    height: 110,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  winnerName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    width: 90,
  },
  winnerRank: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
