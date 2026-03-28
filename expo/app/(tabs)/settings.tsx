import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Share, Platform, Linking, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { ChevronRight, Info, Download, Shield, ExternalLink, Lock } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConsentManagement } from '@/components/ConsentManagement';
import SecurityDashboard from '@/components/SecurityDashboard';
import MedicalReportViewer from '@/components/MedicalReportViewer';
import { validateCycleLength, validatePeriodLength } from '@/utils/validation';
import { APP_CONFIG } from '@/constants/app';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { profile, updateProfile, logs, cycles, resetAllData } = usePeriodStore();
  const [cycleLength, setCycleLength] = useState(profile.cycleAvgLength.toString());
  const [periodLength, setPeriodLength] = useState(profile.periodAvgLength.toString());
  const [notifications, setNotifications] = useState(true);
  const [showConsentManagement, setShowConsentManagement] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showMedicalReport, setShowMedicalReport] = useState(false);
  
  const { isLoading: isExporting, execute: executeExport } = useAsyncOperation();

  const handleSaveCycleSettings = useCallback(() => {
    const cycleValidation = validateCycleLength(cycleLength);
    const periodValidation = validatePeriodLength(periodLength);

    if (!cycleValidation.isValid) {
      Alert.alert('Invalid Cycle Length', cycleValidation.error);
      return;
    }

    if (!periodValidation.isValid) {
      Alert.alert('Invalid Period Length', periodValidation.error);
      return;
    }

    updateProfile({
      cycleAvgLength: parseInt(cycleLength, 10),
      periodAvgLength: parseInt(periodLength, 10),
    });

    Alert.alert('Settings Saved', 'Your cycle settings have been updated');
  }, [cycleLength, periodLength, updateProfile]);

  const handleExportData = useCallback(async () => {
    await executeExport(
      async () => {
        const exportData = {
          profile,
          logs,
          cycles,
          exportDate: new Date().toISOString(),
          appVersion: APP_CONFIG.VERSION,
          appName: APP_CONFIG.NAME,
        };

        const jsonData = JSON.stringify(exportData, null, 2);

        if (Platform.OS === 'web') {
          try {
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${APP_CONFIG.NAME.toLowerCase()}-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return 'web-download';
          } catch (error) {
            await Share.share({
              message: jsonData,
              title: `${APP_CONFIG.NAME} Data Export`,
            });
            return 'web-share';
          }
        } else {
          const fileName = `${APP_CONFIG.NAME.toLowerCase()}-export-${new Date().toISOString().split('T')[0]}.json`;
          const fileUri = FileSystem.documentDirectory + fileName;

          await FileSystem.writeAsStringAsync(fileUri, jsonData);

          await Share.share({
            url: fileUri,
            title: `${APP_CONFIG.NAME} Data Export`,
          });
          return 'mobile-export';
        }
      },
      () => {
        Alert.alert('Export Successful', 'Your data has been exported successfully');
      },
      (error) => {
        Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
      }
    );
  }, [profile, logs, cycles, executeExport]);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert('Data Reset', 'All your data has been reset.');
          }
        },
      ]
    );
  }, [resetAllData]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://cyclix.app/privacy').catch(() => {
      Alert.alert(
        'Privacy Policy',
        'Your health data is stored locally on your device and is never shared with third parties without your explicit consent. We use industry-standard encryption to protect your information.',
        [{ text: 'OK' }]
      );
    });
  }, []);

  const handleTermsOfService = useCallback(() => {
    Linking.openURL('https://cyclix.app/terms').catch(() => {
      Alert.alert(
        'Terms of Service',
        `By using ${APP_CONFIG.NAME}, you agree to use it for personal health tracking purposes only. This app is not a substitute for professional medical advice.`,
        [{ text: 'OK' }]
      );
    });
  }, []);

  const handleConsentManagement = useCallback(() => {
    setShowConsentManagement(true);
  }, []);

  const handleSecurityDashboard = useCallback(() => {
    setShowSecurityDashboard(true);
  }, []);

  const handleMedicalReport = useCallback(() => {
    setShowMedicalReport(true);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: Platform.OS === 'android' ? 20 : 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginLeft: 16,
    },
    input: {
      width: Platform.OS === 'android' ? 80 : 60,
      textAlign: 'center',
      marginRight: 8,
    },
    inputUnit: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.subtext,
    },
    toggleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Platform.OS === 'android' ? 16 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.text,
      flex: 1,
    },
    menuItem: {
      paddingVertical: Platform.OS === 'android' ? 20 : 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.text,
      flex: 1,
    },
    dangerText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.error,
      flex: 1,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    exportButtonText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.secondary,
      marginRight: 8,
      flex: 1,
    },
    aboutSection: {
      alignItems: 'center',
      padding: 24,
      marginTop: 16,
    },
    versionText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.subtext,
      marginTop: 8,
    },
    copyrightText: {
      fontSize: Platform.OS === 'android' ? 14 : 12,
      color: colors.subtext,
      marginTop: 4,
      textAlign: 'center',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cycle Settings</Text>

        <View style={styles.inputRow}>
          <Text style={styles.settingLabel}>Average Cycle Length</Text>
          <View style={styles.inputContainer}>
            <Input
              style={styles.input}
              keyboardType="number-pad"
              value={cycleLength}
              onChangeText={setCycleLength}
              validate={validateCycleLength}
            />
            <Text style={styles.inputUnit}>days</Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.settingLabel}>Average Period Length</Text>
          <View style={styles.inputContainer}>
            <Input
              style={styles.input}
              keyboardType="number-pad"
              value={periodLength}
              onChangeText={setPeriodLength}
              validate={validatePeriodLength}
            />
            <Text style={styles.inputUnit}>days</Text>
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSaveCycleSettings}
          variant="primary"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.toggleItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.toggleItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleMedicalReport}>
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <Info size={20} color={colors.secondary} style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Medical Report</Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleExportData}
          disabled={isExporting}
        >
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <Text style={styles.exportButtonText}>
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Text>
              <Download size={20} color={colors.secondary} />
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSecurityDashboard}>
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <Lock size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Security & HIPAA</Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleConsentManagement}>
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <Shield size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Privacy & Consent</Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <ExternalLink size={20} color={colors.subtext} style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleTermsOfService}>
          <View style={styles.menuItemContent}>
            <View style={styles.exportButton}>
              <ExternalLink size={20} color={colors.subtext} style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Terms of Service</Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleResetData}>
          <View style={styles.menuItemContent}>
            <Text style={styles.dangerText}>Reset All Data</Text>
            <ChevronRight size={20} color={colors.error} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.aboutSection}>
        <Info size={24} color={colors.subtext} />
        <Text style={styles.versionText}>{APP_CONFIG.NAME} v{APP_CONFIG.VERSION}</Text>
        <Text style={styles.copyrightText}>{APP_CONFIG.COPYRIGHT}</Text>
      </View>

      {isExporting && (
        <LoadingSpinner
          text="Exporting your data..."
          overlay
        />
      )}

      <Modal 
        visible={showSecurityDashboard} 
        animationType="slide" 
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.text
            }}>Security Dashboard</Text>
            <TouchableOpacity onPress={() => setShowSecurityDashboard(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
          <SecurityDashboard />
        </View>
      </Modal>

      <Modal 
        visible={showMedicalReport} 
        animationType="slide" 
        presentationStyle="fullScreen"
      >
        <MedicalReportViewer 
          visible={showMedicalReport}
          onClose={() => setShowMedicalReport(false)}
        />
      </Modal>

      {showConsentManagement && (
        <View style={StyleSheet.absoluteFill}>
          <ConsentManagement onBack={() => setShowConsentManagement(false)} />
        </View>
      )}
    </ScrollView>
  );
}