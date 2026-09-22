import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { CompetitionState } from '../types';

interface Props {
  competitionState: CompetitionState;
  isRegistered: boolean;
  loading?: boolean;
  onPress: () => void;
}

interface ButtonConfig {
  label: string;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bg: string;
  textColor: string;
  disabled: boolean;
}

const getConfig = (
  state: CompetitionState,
  isRegistered: boolean
): ButtonConfig => {
  switch (state) {
    case 'UPCOMING':
      return {
        label: 'Coming Soon',
        icon: 'time-outline',
        bg: COLORS.textMuted,
        textColor: COLORS.white,
        disabled: true,
      };
    case 'OPEN':
      return {
        label: 'Register Now',
        icon: 'add-circle-outline',
        bg: COLORS.primary,
        textColor: COLORS.white,
        disabled: false,
      };
    case 'OPEN_FULL':
      return {
        label: 'No Spots Left',
        icon: 'close-circle-outline',
        bg: COLORS.textMuted,
        textColor: COLORS.white,
        disabled: true,
      };
    case 'REGISTRATION_CLOSED':
      return {
        label: 'Registration Closed',
        icon: 'lock-closed-outline',
        bg: COLORS.textMuted,
        textColor: COLORS.white,
        disabled: true,
      };
    case 'REGISTERED':
      return {
        label: 'Upload Submission',
        sublabel: 'Registered',
        icon: 'cloud-upload-outline',
        bg: COLORS.primaryDark,
        textColor: COLORS.white,
        disabled: false,
      };
    case 'REGISTERED_SUBMISSION_OPEN':
      return {
        label: 'Upload Submission',
        sublabel: 'Submission window is open!',
        icon: 'cloud-upload-outline',
        bg: COLORS.primary,
        textColor: COLORS.white,
        disabled: false,
      };
    case 'SUBMITTED':
      return {
        label: 'Submission Received',
        sublabel: 'Your entry is under review',
        icon: 'checkmark-circle',
        bg: COLORS.success,
        textColor: COLORS.white,
        disabled: true,
      };
    case 'CLOSED':
      return {
        label: 'Competition Closed',
        icon: 'flag-outline',
        bg: COLORS.textMuted,
        textColor: COLORS.white,
        disabled: true,
      };
    case 'COMPLETED':
      return {
        label: 'View Winners',
        icon: 'trophy-outline',
        bg: COLORS.gold,
        textColor: COLORS.white,
        disabled: false,
      };
    default:
      return {
        label: 'Register Now',
        bg: COLORS.primary,
        textColor: COLORS.white,
        disabled: false,
      };
  }
};

export const BottomCTA: React.FC<Props> = ({
  competitionState,
  isRegistered,
  loading = false,
  onPress,
}) => {
  const config = getConfig(competitionState, isRegistered);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: config.bg },
          config.disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={config.disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <View style={styles.btnInner}>
            {config.icon && (
              <Ionicons name={config.icon} size={20} color={config.textColor} />
            )}
            <View>
              <Text style={[styles.btnLabel, { color: config.textColor }]}>
                {config.label}
              </Text>
              {config.sublabel && (
                <Text style={[styles.btnSublabel, { color: config.textColor }]}>
                  {config.sublabel}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  button: {
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  btnLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  btnSublabel: {
    fontSize: FONT_SIZES.xs,
    opacity: 0.85,
    textAlign: 'center',
  },
});
