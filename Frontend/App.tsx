import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { CompetitionDetailScreen } from './src/screens/CompetitionDetailScreen';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from './src/theme';
import { getDefaultBaseUrl, getStoredBaseUrl, setStoredBaseUrl } from './src/api/client';

export default function App() {
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const url = await getStoredBaseUrl();
    setCurrentUrl(url);
    setInputUrl(url);
    fetchFirstCompetition(url);
  };

  const fetchFirstCompetition = async (baseUrlOverride?: string) => {
    setLoading(true);
    setError(null);
    const targetUrl = (baseUrlOverride || currentUrl || (await getStoredBaseUrl())).trim();
    setCurrentUrl(targetUrl);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.get(`${targetUrl}/competitions`, {
        headers,
        timeout: 8000,
      });
      const competitions = res.data?.data;

      if (competitions && competitions.length > 0) {
        // Save the working URL so the entire app uses it
        await setStoredBaseUrl(targetUrl);
        setCompetitionId(competitions[0]._id);
      } else {
        setError('No competitions found in database. Please run: npm run seed in Backend.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(`Cannot reach backend at:\n${targetUrl}\n\nDetails: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (url: string) => {
    setInputUrl(url);
    await setStoredBaseUrl(url);
    fetchFirstCompetition(url);
  };

  const handleCustomSave = async () => {
    if (!inputUrl.trim()) return;
    await setStoredBaseUrl(inputUrl.trim());
    fetchFirstCompetition(inputUrl.trim());
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Connecting to backend...</Text>
          <Text style={styles.subText}>{currentUrl}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (error || !competitionId) {
    return (
      <SafeAreaProvider>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollCentered}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.errorTitle}>⚠️ Setup Required</Text>
            <Text style={styles.errorText}>{error}</Text>

            <View style={styles.configCard}>
              <Text style={styles.configLabel}>Backend API URL</Text>
              <TextInput
                style={styles.input}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="http://172.20.10.2:5000/api"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleCustomSave}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetsCard}>
              <Text style={styles.presetLabel}>Quick Presets:</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyPreset('http://172.20.10.2:5000/api')}
                >
                  <Text style={styles.presetBtnText}>📱 Wi-Fi (172.20.10.2)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyPreset('http://localhost:5000/api')}
                >
                  <Text style={styles.presetBtnText}>💻 Localhost</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyPreset('http://10.0.2.2:5000/api')}
                >
                  <Text style={styles.presetBtnText}>🤖 Emulator</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.hint}>
              {'Make sure backend is running on port 5000:\n1. cd Backend\n2. npm run dev'}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CompetitionDetailScreen competitionId={competitionId} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  scrollCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semiBold,
    marginTop: SPACING.sm,
  },
  subText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    width: '100%',
  },
  configCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  configLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
  presetsCard: {
    width: '100%',
    gap: SPACING.xs,
  },
  presetLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  presetBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  presetBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: COLORS.borderLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    width: '100%',
  },
});
