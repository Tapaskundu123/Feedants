import React, { useState, useCallback, useRef } from 'react';
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
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
import { authApi, competitionApi } from '../api/client';

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
  // ─── Upload submission dialog state ──────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // ─── Upload Submission ────────────────────────────────────
  const handleUploadSubmit = async () => {
    const url = submissionUrl.trim();
    if (!url) {
      setUploadError('Please enter a video URL.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUploadError('URL must start with http:// or https://');
      return;
    }
    setUploadLoading(true);
    setUploadError(null);
    try {
      await competitionApi.submit(competitionId, url);
      setShowUploadModal(false);
      setSubmissionUrl('');
      Alert.alert(
        '🎉 Submission Received!',
        'Your entry has been submitted successfully. You will receive results once judging is complete.',
        [{ text: 'OK', onPress: refetch }]
      );
    } catch (err: any) {
      // Map backend error codes to friendly messages
      const msg: string = err.message || '';
      if (msg.includes('not opened yet')) {
        setUploadError('The submission window has not opened yet. Please wait.');
      } else if (msg.includes('window has closed') || msg.includes('closed')) {
        setUploadError('The submission deadline has passed.');
      } else if (msg.includes('already submitted')) {
        setUploadError('You have already submitted an entry.');
      } else if (msg.includes('not found')) {
        setUploadError('Registration not found. Please make sure you are registered.');
      } else {
        setUploadError(msg || 'Submission failed. Please try again.');
      }
    } finally {
      setUploadLoading(false);
    }
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
        setSubmissionUrl('');
        setUploadError(null);
        setShowUploadModal(true);
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

  // ─── Smart countdown: target & label based on state ─────
  const countdownTarget = (
    competitionState === 'REGISTERED_SUBMISSION_OPEN' ||
    competitionState === 'SUBMITTED'
  )
    ? competition.dates.submissionEnd
    : competition.dates.registrationClose;

  const countdownLabel = (
    competitionState === 'REGISTERED_SUBMISSION_OPEN'
  )
    ? 'Submission window closes in'
    : competitionState === 'SUBMITTED'
    ? 'Results will be announced'
    : 'Registration closes in';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Auth modal */}
      <AuthModal
        visible={showAuth}
        onLogin={handleLogin}
        onClose={() => setShowAuth(false)}
      />

      {/* ── Upload Submission Modal ── */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
              style={styles.kvWrapper}
            >
              <View style={styles.uploadModal}>
                {/* Drag handle */}
                <View style={styles.dragHandle} />
                <Text style={styles.uploadTitle}>Upload Submission</Text>
                <Text style={styles.uploadSub}>
                  Paste your video URL below (YouTube, Vimeo, Google Drive, etc.)
                </Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={COLORS.textMuted}
                  value={submissionUrl}
                  onChangeText={(t) => { setSubmissionUrl(t); setUploadError(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                {uploadError ? (
                  <Text style={styles.uploadError}>{uploadError}</Text>
                ) : null}
                <View style={styles.uploadActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowUploadModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, uploadLoading && styles.submitBtnDisabled]}
                    onPress={handleUploadSubmit}
                    disabled={uploadLoading}
                    activeOpacity={0.8}
                  >
                    {uploadLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Entry</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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

        {/* ── Registration / Submission Status Banner ── */}
        {competitionState === 'REGISTERED' && (
          <View style={[styles.statusBanner, styles.statusBannerRegistered]}>
            <Text style={styles.statusBannerIcon}>✅</Text>
            <View>
              <Text style={styles.statusBannerTitle}>You're Registered!</Text>
              <Text style={styles.statusBannerSub}>Submission window opens soon.</Text>
            </View>
          </View>
        )}
        {competitionState === 'REGISTERED_SUBMISSION_OPEN' && (
          <View style={[styles.statusBanner, styles.statusBannerSubmit]}>
            <Text style={styles.statusBannerIcon}>🎬</Text>
            <View>
              <Text style={styles.statusBannerTitle}>Submission Window is Open!</Text>
              <Text style={styles.statusBannerSub}>Tap "Upload Submission" below to submit your entry.</Text>
            </View>
          </View>
        )}
        {competitionState === 'SUBMITTED' && (
          <View style={[styles.statusBanner, styles.statusBannerDone]}>
            <Text style={styles.statusBannerIcon}>🏆</Text>
            <View>
              <Text style={styles.statusBannerTitle}>Entry Submitted!</Text>
              <Text style={styles.statusBannerSub}>Your submission is under review. Results coming soon.</Text>
            </View>
          </View>
        )}

        {/* ── Prize + Spots ── */}
        <PrizeEntryRow competition={competition} />

        <View style={styles.divider} />

        {/* ── Judge ── */}
        <JudgeCard judge={competition.judge} />

        <View style={styles.divider} />

        {/* ── Smart Countdown ── */}
        <CountdownTimer
          targetDate={countdownTarget}
          label={countdownLabel}
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

        {/* ── How will you receive prize money? (Video Guide) ── */}
        <TouchableOpacity
          style={styles.prizeVideoCard}
          onPress={() => {
            Alert.alert(
              'How Prize Money is Distributed',
              'Winners are announced on the result date. Prize money is directly credited to your verified bank account or UPI ID within 24-48 hours. No hidden fees or deductions.',
              [{ text: 'Got It', style: 'default' }]
            );
          }}
          activeOpacity={0.8}
        >
          <View style={styles.prizeVideoLeft}>
            <View style={styles.playIconCircle}>
              <Ionicons name="play" size={15} color={COLORS.white} />
            </View>
            <View style={styles.prizeVideoText}>
              <Text style={styles.prizeVideoTitle}>How will you receive prize money?</Text>
              <Text style={styles.prizeVideoSub}>Watch video to know more</Text>
            </View>
          </View>
          <View style={styles.watchPill}>
            <Text style={styles.watchText}>Watch</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* ── Separate Policy & Payout Trust Row ── */}
        <View style={styles.policyRowContainer}>
          <TouchableOpacity
            style={styles.policyCard}
            onPress={() => {
              Alert.alert(
                'Refund Policy',
                '• 100% full refund if competition is cancelled by organizers.\n• Refund processed within 3-5 business days to original payment method.\n• Registrations cannot be refunded once submission window closes.',
                [{ text: 'Close', style: 'cancel' }]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.policyCardLeft}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#059669" />
              <Text style={styles.policyCardText}>Refund Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.payoutCard}>
            <Ionicons name="card-outline" size={15} color={COLORS.primary} />
            <Text style={styles.payoutCardText}>Direct bank transfer</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Referral ── */}
        <ReferralCard competitionId={competitionId} isLoggedIn={isLoggedIn} />

        {/* ── Secure Payment & Razorpay Guarantee Banner ── */}
        <View style={styles.secureTrustCard}>
          <View style={styles.secureTrustHeader}>
            <View style={styles.secureTrustLeft}>
              <View style={styles.secureShieldIcon}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.secureTrustTitle}>100% Secure Payment</Text>
                <Text style={styles.secureTrustSub}>Trusted & encrypted transactions</Text>
              </View>
            </View>
            <View style={styles.secureTrustRight}>
              <Text style={styles.securePoweredBy}>Powered by</Text>
              <Image
                source={require('../../assets/razorpay-logo.png')}
                style={styles.secureTrustLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.secureTrustPills}>
            <View style={styles.securePill}>
              <Ionicons name="lock-closed-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.securePillText}>256-Bit SSL</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="flash-outline" size={12} color="#D97706" />
              <Text style={styles.securePillText}>Instant Booking</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="card-outline" size={12} color={COLORS.primary} />
              <Text style={styles.securePillText}>UPI / Cards / NetBanking</Text>
            </View>
          </View>
        </View>

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
  // ── Prize Video Card ─────────────────────────────────────────
  prizeVideoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  prizeVideoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  playIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prizeVideoText: {
    flex: 1,
  },
  prizeVideoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  prizeVideoSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  watchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.xs,
  },
  watchText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  // ── Separate Policy & Payout Trust Row ────────────────────────
  policyRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  policyCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  policyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  policyCardText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  payoutCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  payoutCardText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  // ── Secure Payment Trust Banner ──────────────────────────────
  secureTrustCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginTop: 4,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  secureTrustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureTrustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  secureShieldIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureTrustTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  secureTrustSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  secureTrustRight: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: SPACING.sm,
  },
  securePoweredBy: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secureTrustLogo: {
    width: 82,
    height: 18,
  },
  secureTrustPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securePillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
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
  // ── Status Banners ───────────────────────────────────────────
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  statusBannerRegistered: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusBannerSubmit: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  statusBannerDone: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  statusBannerIcon: {
    fontSize: 20,
  },
  statusBannerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  statusBannerSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // ── Upload Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kvWrapper: {
    justifyContent: 'flex-end',
  },
  uploadModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  uploadTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  uploadSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: -SPACING.xs,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  uploadError: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});
