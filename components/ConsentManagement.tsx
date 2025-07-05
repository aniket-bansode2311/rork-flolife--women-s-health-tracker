import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, Linking } from 'react-native';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/hooks/useTheme';
import { Shield, Download, Trash2, ExternalLink, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConsentSettings } from './GDPRConsent';

interface ConsentManagementProps {
  onBack?: () => void;
}

export const ConsentManagement: React.FC<ConsentManagementProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const [consents, setConsents] = useState<ConsentSettings>({
    analyticsConsent: false,
    healthSyncConsent: false,
    marketingConsent: false,
    researchConsent: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const savedConsents = await AsyncStorage.getItem('user_consents');
      if (savedConsents) {
        setConsents(JSON.parse(savedConsents));
      }
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConsents = async (newConsents: ConsentSettings) => {
    try {
      await AsyncStorage.setItem('user_consents', JSON.stringify(newConsents));
      setConsents(newConsents);
    } catch (error) {
      console.error('Error saving consents:', error);
      Alert.alert('Error', 'Failed to save consent preferences');
    }
  };

  const updateConsent = (key: keyof ConsentSettings, value: boolean) => {
    const newConsents = { ...consents, [key]: value };
    saveConsents(newConsents);
  };

  const exportData = async () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and sent to your registered email address within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Export', 
          onPress: () => {
            // In a real app, this would trigger a backend process
            Alert.alert('Export Requested', 'You will receive your data export via email within 24 hours.');
          }
        }
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All your health data, cycle history, and account information will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete Everything', 
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, this would call the backend to delete the account
                    Alert.alert('Account Deletion', 'Your account deletion request has been processed. You will receive a confirmation email.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://cyclix.app/privacy').catch(() => {
      Alert.alert('Error', 'Unable to open privacy policy');
    });
  };

  const openTerms = () => {
    Linking.openURL('https://cyclix.app/terms').catch(() => {
      Alert.alert('Error', 'Unable to open terms of service');
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
      fontSize: 24,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
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
    },
    consentDescription: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
    },
    actionButton: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    actionButtonSubtext: {
      fontSize: 12,
      color: colors.subtext,
      marginLeft: 12,
      marginTop: 4,
    },
    deleteButton: {
      borderColor: colors.error,
    },
    deleteButtonText: {
      color: colors.error,
    },
    infoBox: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    infoText: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      marginLeft: 12,
      flex: 1,
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={32} color={colors.primary} />
          <Text style={styles.title}>Privacy & Consent</Text>
          <Text style={styles.subtitle}>
            Manage your data preferences and privacy settings
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Info size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            You can change these settings at any time. Changes take effect immediately and 
            apply to future data processing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage Preferences</Text>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Analytics & Improvements</Text>
              <Switch
                value={consents.analyticsConsent}
                onValueChange={(value) => updateConsent('analyticsConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.analyticsConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Help improve Cyclix by sharing anonymous usage data
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Health App Integration</Text>
              <Switch
                value={consents.healthSyncConsent}
                onValueChange={(value) => updateConsent('healthSyncConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.healthSyncConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Sync data with Apple Health or Google Fit
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Marketing Communications</Text>
              <Switch
                value={consents.marketingConsent}
                onValueChange={(value) => updateConsent('marketingConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.marketingConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Receive health tips and product updates via email
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Research Participation</Text>
              <Switch
                value={consents.researchConsent}
                onValueChange={(value) => updateConsent('researchConsent', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={consents.researchConsent ? colors.background : colors.subtext}
              />
            </View>
            <Text style={styles.consentDescription}>
              Contribute to women's health research with anonymous data
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Rights</Text>
          
          <View style={styles.actionButton} onTouchEnd={exportData}>
            <Download size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionButtonText}>Export My Data</Text>
              <Text style={styles.actionButtonSubtext}>
                Download all your personal data in a portable format
              </Text>
            </View>
          </View>

          <View style={[styles.actionButton, styles.deleteButton]} onTouchEnd={deleteAccount}>
            <Trash2 size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Account</Text>
              <Text style={styles.actionButtonSubtext}>
                Permanently delete your account and all data
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Documents</Text>
          
          <View style={styles.actionButton} onTouchEnd={openPrivacyPolicy}>
            <ExternalLink size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </View>

          <View style={styles.actionButton} onTouchEnd={openTerms}>
            <ExternalLink size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
          </View>
        </View>

        {onBack && (
          <Button
            title="Back to Settings"
            onPress={onBack}
            style={{ backgroundColor: colors.primary, marginTop: 20 }}
          />
        )}
      </ScrollView>
    </View>
  );
};