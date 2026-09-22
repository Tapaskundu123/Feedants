import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CompetitionHeader } from '../components/CompetitionHeader';
import { PrizeEntryRow } from '../components/PrizeEntryRow';
import { JudgeCard } from '../components/JudgeCard';
import { CountdownTimer } from '../components/CountdownTimer';
import { ImportantDates } from '../components/ImportantDates';
import { PreviousWinners } from '../components/PreviousWinners';
import { TabsSection } from '../components/TabsSection';
import { RewardsTable } from '../components/RewardsTable';
import { ReferralCard } from '../components/ReferralCard';
import { BottomCTA } from '../components/BottomCTA';

import { useCompetition } from '../hooks/useCompetition';
import { useRegistration } from '../hooks/useRegistration';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } from '../theme';
import { CompetitionState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/client';

// ─── Auth Modal (demo login) ──────────────────────────────────
interface AuthModalProps {
  visible: boolean;
  onLogin: (token: string) => void;
  onClose: () => void;
}

const DEMO_USERS = [
  {
    label: '🔴 Not Registered (Aryan)',
    email: 'aryan@feedants.com',
    password: 'Password123!',
  },
  {
    label: '✅ Already Registered (Priya)',
    email: 'priya@feedants.com',
    password: 'Password123!',
  },
];

const AuthModal: React.FC<AuthModalProps> = ({ visible, onLogin, onClose }) => {
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token } = res.data.data;
      await AsyncStorage.setItem('auth_token', token);
      onLogin(token);
    } catch (err: unknown) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.overlay}>
      <View style={authStyles.modal}>
        <View style={authStyles.header}>
          <Text style={authStyles.title}>Select Demo Account</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={authStyles.subtitle}>
          Choose a demo user to test different competition states
        </Text>
        {DEMO_USERS.map((u) => (
          <TouchableOpacity
            key={u.email}
            style={authStyles.userBtn}
            onPress={() => handleLogin(u.email, u.password)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={authStyles.userLabel}>{u.label}</Text>
            <Text style={authStyles.userEmail}>{u.email}</Text>
          </TouchableOpacity>
        ))}
        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />}
      </View>
    </View>
  );
};

const authStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  userBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
    backgroundColor: COLORS.background,
  },
  userLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

// ─── Main Screen ──────────────────────────────────────────────
interface Props {
  competitionId?: string;
  onBack?: () => void;
}

// Fallback ID — will be replaced by seeded ID in real usage
const DEFAULT_COMPETITION_ID = 'REPLACE_WITH_SEEDED_ID';

export const CompetitionDetailScreen: React.FC<Props> = ({
  competitionId = DEFAULT_COMPETITION_ID,
  onBack,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { data, loading, error, refetch } = useCompetition(competitionId);
  const { registering, register, error: regError, clearError } = useRegistration(
    data?.competition?.entryFee ?? 0
  );

  // ─── Check auth on mount ──────────────────────────────────
  React.useEffect(() => {
    AsyncStorage.getItem('auth_token').then((t) => {
      if (t) setIsLoggedIn(true);
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLogin = (token: string) => {
    setIsLoggedIn(true);
    setShowAuth(false);
    refetch();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    refetch();
  };

  const handleCTAPress = async () => {
    if (!data) return;
    const { competitionState } = data;

    // Require login for actions
    if (!isLoggedIn && (competitionState === 'OPEN' || competitionState === 'REGISTERED' || competitionState === 'REGISTERED_SUBMISSION_OPEN')) {
      setShowAuth(true);
      return;
    }

    switch (competitionState) {
      case 'OPEN': {
        Alert.alert(
          'Register for Competition',
          `Entry fee: ₹${data.competition.entryFee}. A mock payment will be processed.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Proceed',
              onPress: async () => {
                const success = await register(competitionId);
                if (success) {
                  Alert.alert('🎉 Registered!', 'You have successfully registered for the competition.');
                  refetch();
                } else if (regError) {
                  Alert.alert('Registration Failed', regError);
                  clearError();
                }
              },
            },
          ]
        );
        break;
      }

      case 'REGISTERED':
      case 'REGISTERED_SUBMISSION_OPEN': {
        Alert.alert(
          'Upload Submission',
          'In the full app, this opens the video/file upload flow.',
          [
            { text: 'OK' },
          ]
        );
        break;
      }

      case 'COMPLETED': {
        Alert.alert('Winners', 'Results are available — navigate to Winners screen.');
        break;
      }

      default:
        break;
    }
  };

  // ─── Loading state ────────────────────────────────────────
  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading competition...</Text>
      </SafeAreaView>
    );
  }

  // ─── Error state ──────────────────────────────────────────
  if (error && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const { competition, competitionState, registrationStatus } = data;
  const isRegistered = registrationStatus !== null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Auth modal */}
      <AuthModal
        visible={showAuth}
        onLogin={handleLogin}
        onClose={() => setShowAuth(false)}
      />

      {/* Demo auth switcher bar */}
      <View style={styles.devBar}>
        <Text style={styles.devBarText}>
          State: <Text style={styles.devBarHighlight}>{competitionState}</Text>
        </Text>
        {isLoggedIn ? (
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.devBarAction}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowAuth(true)} activeOpacity={0.7}>
            <Text style={styles.devBarAction}>Login as User</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ── */}
        <CompetitionHeader
          competition={competition}
          isRegistered={isRegistered}
          onBack={onBack || (() => {})}
        />

        <View style={styles.divider} />

        {/* ── Prize + Spots ── */}
        <PrizeEntryRow competition={competition} />

        <View style={styles.divider} />

        {/* ── Judge ── */}
        <JudgeCard judge={competition.judge} />

        <View style={styles.divider} />

        {/* ── Countdown ── */}
        <CountdownTimer
          targetDate={competition.dates.registrationClose}
          label="Registration closes in"
        />

        {/* ── Important Dates ── */}
        <View style={styles.sectionGap} />
        <ImportantDates dates={competition.dates} />

        <View style={styles.divider} />

        {/* ── Previous Winners ── */}
        <PreviousWinners winners={competition.previousWinners} />

        <View style={styles.divider} />

        {/* ── Tabs: About / Judging / Rules ── */}
        <TabsSection
          about={competition.about || competition.description}
          judgingParameters={competition.judgingParameters}
          rulesEligibility={competition.rulesEligibility}
        />

        <View style={styles.divider} />

        {/* ── Rewards ── */}
        <RewardsTable
          rewards={competition.rewards}
          disclaimer={competition.disclaimer}
        />

        {/* ── Prize Money Info ── */}
        <View style={styles.prizeInfoCard}>
          <View style={styles.prizeInfoLeft}>
            <View style={styles.prizeInfoIcon}>
              <Ionicons name="play" size={14} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.prizeInfoTitle}>How will you receive prize money?</Text>
              <Text style={styles.prizeInfoSub}>Watch video to know more</Text>
            </View>
          </View>
          <View style={styles.prizeInfoRight}>
            <View style={styles.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
              <Text style={styles.prizeInfoSmall}>Refund policy</Text>
            </View>
            <View style={styles.secureRow}>
              <Ionicons name="shield-outline" size={14} color={COLORS.primary} />
              <Text style={styles.prizeInfoSmall}>Secure payments powered by Razorpay</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Referral ── */}
        <ReferralCard competitionId={competitionId} isLoggedIn={isLoggedIn} />

        {/* ── Hear from Users ── */}
        <View style={styles.hearRow}>
          <View>
            <Text style={styles.hearTitle}>Hear From Our Users</Text>
            <Text style={styles.hearSub}>See what participants say about Feedants</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>

        {/* ── Ad Placeholder ── */}
        <View style={styles.adPlaceholder}>
          <Ionicons name="megaphone-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.adText}>Ad Here</Text>
        </View>

        {/* Bottom padding for CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <BottomCTA
        competitionState={competitionState}
        isRegistered={isRegistered}
        loading={registering}
        onPress={handleCTAPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: COLORS.background,
  },
  divider: {
    height: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  sectionGap: {
    height: SPACING.xs,
  },
  devBar: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.base,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devBarText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  devBarHighlight: {
    color: COLORS.gold,
    fontWeight: FONT_WEIGHTS.bold,
  },
  devBarAction: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semiBold,
    textDecorationLine: 'underline',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
  prizeInfoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  prizeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  prizeInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prizeInfoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  prizeInfoSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  prizeInfoRight: {
    gap: SPACING.xs,
    flexShrink: 0,
    maxWidth: 140,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prizeInfoSmall: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  hearRow: {
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
  hearTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  hearSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adPlaceholder: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  adText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});
