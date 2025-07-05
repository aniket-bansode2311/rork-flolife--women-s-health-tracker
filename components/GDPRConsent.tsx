import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/hooks/useTheme';
import { ExternalLink, Shield, Heart, Mail, BarChart3 } from 'lucide-react-native';

export interface ConsentSettings {
  analyticsConsent: boolean;
  healthSyncConsent: boolean;
  marketingConsent: boolean;
  researchConsent: boolean;
}

interface GDPRConsentProps {
  onComplete: (consents: ConsentSettings) => void;
  onSkip?: () => void;
}

export const GDPRConsent: React.FC<GDPRConsentProps> = ({ onComplete, onSkip }) => {
  const { colors } = useTheme();
  const [consents, setConsents] = useState<ConsentSettings>({
    analyticsConsent: false,
    healthSyncConsent: false,
    marketingConsent: false,
    researchConsent: false,
  });

  const updateConsent = (key: keyof ConsentSettings, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://cyclix.app/privacy').catch(() => {
      Alert.alert('Error', 'Unable to open privacy policy. Please visit cyclix.app/privacy');
    });
  };

  const openTerms = () => {
    Linking.openURL('https://cyclix.app/terms').catch(() => {
      Alert.alert('Error', 'Unable to open terms of service. Please visit cyclix.app/terms');
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 22,
    },
    section: {
      marginBottom: 24,
    },
    consentItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    consentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    consentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginLeft: 12,
    },
    consentDescription: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      marginLeft: 32,
    },
    legalSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    legalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    legalText: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      marginBottom: 16,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    linkText: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 8,
      textDecorationLine: 'underline',
    },
    buttonContainer: {
      gap: 12,
      marginTop: 20,
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    skipButtonText: {
      color: colors.subtext,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={48} color={colors.primary} />
          <Text style={styles.title}>Your Privacy Choices</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience while keeping your data secure
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <BarChart3 size={20} color={colors.primary} />
              <Text style={styles.consentTitle}>Analytics & Improvements</Text>
              <Switch
                value={consents.analyticsConsent}
                onValueChange={(value) => updateConsent('analyticsConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.analyticsConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Share anonymous usage data to help us improve Cyclix. This includes app crashes, 
              feature usage, and performance metrics. No personal health data is included.
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Heart size={20} color={colors.primary} />
              <Text style={styles.consentTitle}>Health App Integration</Text>
              <Switch
                value={consents.healthSyncConsent}
                onValueChange={(value) => updateConsent('healthSyncConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.healthSyncConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Sync your cycle data with Apple Health or Google Fit. This allows you to view 
              your reproductive health data alongside other health metrics.
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Mail size={20} color={colors.primary} />
              <Text style={styles.consentTitle}>Health Tips & Updates</Text>
              <Switch
                value={consents.marketingConsent}
                onValueChange={(value) => updateConsent('marketingConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.marketingConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Receive personalized health tips, cycle insights, and product updates via email. 
              We'll only send relevant, helpful content - no spam.
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Shield size={20} color={colors.primary} />
              <Text style={styles.consentTitle}>Women's Health Research</Text>
              <Switch
                value={consents.researchConsent}
                onValueChange={(value) => updateConsent('researchConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.researchConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Contribute to women's health research with anonymous, aggregated data. 
              Help advance understanding of menstrual health and reproductive wellness.
            </Text>
          </View>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Legal Information</Text>
          <Text style={styles.legalText}>
            By continuing, you agree to our Terms of Service and acknowledge our Privacy Policy. 
            You can change these preferences anytime in Settings.
          </Text>
          
          <View style={styles.linkRow}>
            <ExternalLink size={16} color={colors.primary} />
            <Text style={styles.linkText} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
          </View>
          
          <View style={styles.linkRow}>
            <ExternalLink size={16} color={colors.primary} />
            <Text style={styles.linkText} onPress={openTerms}>
              Terms of Service
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue with Selected Preferences"
            onPress={() => onComplete(consents)}
            style={{ backgroundColor: colors.primary }}
          />
          
          {onSkip && (
            <Button
              title="Skip for Now"
              onPress={onSkip}
              style={styles.skipButton}
              textStyle={styles.skipButtonText}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};