import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { competitionApi } from '../api/client';

interface Props {
  competitionId: string;
  isLoggedIn: boolean;
}

export const ReferralCard: React.FC<Props> = ({ competitionId, isLoggedIn }) => {
  const [referralLink, setReferralLink] = useState('https://feedants.com/r/referral123');
  const [earningPerSignup, setEarningPerSignup] = useState(10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    competitionApi
      .getReferral(competitionId)
      .then((res) => {
        const { referralLink: link, earningPerSignup: eps } = res.data.data;
        setReferralLink(link);
        setEarningPerSignup(eps);
      })
      .catch(() => {/* use defaults */});
  }, [competitionId, isLoggedIn]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Join Feedants Classical Dance Competition! Use my referral link: ${referralLink}`,
      url: referralLink,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="megaphone" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Refer & Earn more discount</Text>
          <View style={styles.linkRow}>
            <TextInput
              style={styles.linkInput}
              value={referralLink}
              editable={false}
              numberOfLines={1}
            />
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.referBtn}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.referBtnText}>Refer Now</Text>
          <Text style={styles.earnText}>
            You earn ₹{earningPerSignup} for every signup
          </Text>
        </TouchableOpacity>
      </View>
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
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  linkInput: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  copyBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  copyBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  referBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  referBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  earnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryMuted,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 80,
  },
});
