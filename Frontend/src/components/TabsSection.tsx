import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, RADIUS } from '../theme';

type Tab = 'about' | 'judging' | 'rules';

interface Props {
  about: string;
  judgingParameters: string;
  rulesEligibility: string;
}

export const TabsSection: React.FC<Props> = ({
  about,
  judgingParameters,
  rulesEligibility,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [expanded, setExpanded] = useState(false);

  const PREVIEW_LENGTH = 160;

  const getContent = () => {
    switch (activeTab) {
      case 'about':
        return about;
      case 'judging':
        return judgingParameters;
      case 'rules':
        return rulesEligibility;
    }
  };

  const content = getContent();
  const isLong = content.length > PREVIEW_LENGTH;
  const displayText = expanded || !isLong ? content : content.slice(0, PREVIEW_LENGTH) + '...';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'about', label: 'About Competition' },
    { key: 'judging', label: 'Judging Parameters' },
    { key: 'rules', label: 'Rules & Eligibility' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              setActiveTab(tab.key);
              setExpanded(false);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.contentText}>{displayText}</Text>
        {isLong && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.viewMoreRow}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMoreText}>
              {expanded ? 'View less' : 'View more'}
            </Text>
            <Text style={styles.viewMoreIcon}>{expanded ? ' ∧' : ' ∨'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  content: {
    padding: SPACING.base,
  },
  contentText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  viewMoreIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
});
