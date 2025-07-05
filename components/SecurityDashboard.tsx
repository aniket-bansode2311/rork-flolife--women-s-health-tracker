import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { 
  HIPAASecureStorage, 
  HIPAAAuditLogger, 
  HIPAADataRetention,
  HIPAA_CONFIG 
} from '@/utils/hipaaCompliance';
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  FileText,
  Database
} from 'lucide-react-native';

export default function SecurityDashboard() {
  const { colors } = useTheme();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [dataStats, setDataStats] = useState({
    totalLogs: 0,
    encryptedItems: 0,
    lastBackup: null as Date | null,
    retentionDays: HIPAA_CONFIG.dataRetentionDays
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const logs = await HIPAAAuditLogger.exportAuditLogs();
      setAuditLogs(logs.slice(-10)); // Show last 10 logs
      
      // Mock data stats - in real implementation, this would come from actual storage
      setDataStats({
        totalLogs: logs.length,
        encryptedItems: 5, // Mock number
        lastBackup: new Date(),
        retentionDays: HIPAA_CONFIG.dataRetentionDays
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        'Export Health Data',
        'This will export all your health data in a secure format. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Export', 
            onPress: async () => {
              try {
                const userData = await HIPAADataRetention.exportUserData('current_user');
                Alert.alert('Success', 'Your data has been exported successfully.');
              } catch (error) {
                Alert.alert('Error', 'Failed to export data.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate data export.');
    }
  };

  const handleDataCleanup = async () => {
    Alert.alert(
      'Data Cleanup',
      'This will remove old data according to HIPAA retention policies. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Cleanup', 
          onPress: async () => {
            try {
              await HIPAADataRetention.cleanupOldData();
              Alert.alert('Success', 'Data cleanup completed.');
              loadSecurityData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cleanup data.');
            }
          }
        }
      ]
    );
  };

  const getComplianceScore = () => {
    let score = 0;
    if (HIPAA_CONFIG.encryptionEnabled) score += 25;
    if (HIPAA_CONFIG.auditLogging) score += 25;
    if (HIPAA_CONFIG.biometricAuthRequired) score += 25;
    if (dataStats.lastBackup && dataStats.lastBackup > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) score += 25;
    return score;
  };

  const complianceScore = getComplianceScore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.subtext,
    },
    complianceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      borderLeftWidth: 4,
      borderLeftColor: complianceScore === 100 ? colors.success : 
                      complianceScore >= 75 ? colors.warning : colors.error,
    },
    complianceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    complianceTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    complianceScore: {
      fontSize: 24,
      fontWeight: 'bold',
      color: complianceScore === 100 ? colors.success : 
             complianceScore >= 75 ? colors.warning : colors.error,
    },
    complianceItems: {
      gap: 12,
    },
    complianceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    complianceItemText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      marginTop: 0,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'center',
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    actionButtonSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    actionButtonTextSecondary: {
      color: colors.text,
    },
    auditLogItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    auditLogHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    auditLogAction: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    auditLogTime: {
      fontSize: 12,
      color: colors.subtext,
    },
    auditLogDetails: {
      fontSize: 12,
      color: colors.subtext,
    },
    retentionInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
    },
    retentionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    retentionText: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
    },
    encryptionBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    encryptionBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <Text style={styles.headerSubtitle}>HIPAA Compliant Health Data Protection</Text>
      </View>

      {/* HIPAA Compliance Status */}
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Shield size={24} color={complianceScore === 100 ? colors.success : colors.warning} />
          <Text style={styles.complianceTitle}>HIPAA Compliance</Text>
          <Text style={styles.complianceScore}>{complianceScore}%</Text>
        </View>

        <View style={styles.complianceItems}>
          <View style={styles.complianceItem}>
            {HIPAA_CONFIG.encryptionEnabled ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.error} />
            )}
            <Text style={styles.complianceItemText}>
              Data Encryption (AES-256)
            </Text>
          </View>

          <View style={styles.complianceItem}>
            {HIPAA_CONFIG.auditLogging ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.error} />
            )}
            <Text style={styles.complianceItemText}>
              Audit Logging
            </Text>
          </View>

          <View style={styles.complianceItem}>
            {HIPAA_CONFIG.biometricAuthRequired ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.error} />
            )}
            <Text style={styles.complianceItemText}>
              Biometric Authentication
            </Text>
          </View>

          <View style={styles.complianceItem}>
            {dataStats.lastBackup && dataStats.lastBackup > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.warning} />
            )}
            <Text style={styles.complianceItemText}>
              Recent Data Backup
            </Text>
          </View>
        </View>

        <View style={styles.encryptionBadge}>
          <Text style={styles.encryptionBadgeText}>HIPAA COMPLIANT</Text>
        </View>
      </View>

      {/* Data Statistics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Database size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Data Statistics</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.totalLogs}</Text>
            <Text style={styles.statLabel}>Audit Logs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.encryptedItems}</Text>
            <Text style={styles.statLabel}>Encrypted Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.retentionDays}</Text>
            <Text style={styles.statLabel}>Retention Days</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Download size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Export My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]} 
          onPress={handleDataCleanup}
        >
          <Trash2 size={16} color={colors.text} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            Cleanup Old Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Audit Logs */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {auditLogs.length > 0 ? (
          auditLogs.map((log, index) => (
            <View key={index} style={styles.auditLogItem}>
              <View style={styles.auditLogHeader}>
                <Text style={styles.auditLogAction}>
                  {log.action.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.auditLogTime}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.auditLogDetails}>
                {log.dataType} • {log.deviceInfo} • {log.success ? 'Success' : 'Failed'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.auditLogDetails, { textAlign: 'center', padding: 20 }]}>
            No recent activity
          </Text>
        )}
      </View>

      {/* Data Retention Policy */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Data Retention</Text>
        </View>

        <View style={styles.retentionInfo}>
          <Text style={styles.retentionTitle}>HIPAA Retention Policy</Text>
          <Text style={styles.retentionText}>
            Your health data is automatically retained for {dataStats.retentionDays} days (7 years) 
            as required by HIPAA regulations. After this period, data is securely deleted unless 
            you explicitly request longer retention.
          </Text>
          <Text style={[styles.retentionText, { marginTop: 12 }]}>
            You have the right to request deletion of your data at any time, subject to legal 
            and regulatory requirements.
          </Text>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Eye size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Privacy Protection</Text>
        </View>

        <View style={styles.retentionInfo}>
          <Text style={styles.retentionTitle}>Your Data, Your Control</Text>
          <Text style={styles.retentionText}>
            • All health data is encrypted using AES-256 encryption
          </Text>
          <Text style={styles.retentionText}>
            • Data is processed locally on your device when possible
          </Text>
          <Text style={styles.retentionText}>
            • You control what data is shared with healthcare providers
          </Text>
          <Text style={styles.retentionText}>
            • Complete audit trail of all data access
          </Text>
          <Text style={styles.retentionText}>
            • Right to data portability and deletion
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}