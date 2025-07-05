import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { generateClinicalPrediction, analyzeSymptomPatterns } from '@/utils/clinicalPredictions';
import { generateTelehealthRecommendations, TelehealthService } from '@/utils/telehealthIntegration';
import { InsightCard } from './insights/InsightCard';
import { StatRow } from './insights/StatRow';
import { Heart, AlertTriangle, Calendar, TrendingUp, Phone, Shield, Activity } from 'lucide-react-native';

export default function AdvancedClinicalInsights() {
  const { colors } = useTheme();
  const { profile, logs, cycles } = usePeriodStore();
  const [showDetailedRisks, setShowDetailedRisks] = useState(false);

  const clinicalAnalysis = useMemo(() => {
    if (!profile.lastPeriodStart || logs.length === 0) {
      return null;
    }

    const clinicalPrediction = generateClinicalPrediction(logs, cycles, profile);
    const symptomPatterns = analyzeSymptomPatterns(logs);
    const telehealthRecommendations = generateTelehealthRecommendations(logs, cycles, clinicalPrediction);

    return {
      clinicalPrediction,
      symptomPatterns,
      telehealthRecommendations
    };
  }, [profile, logs, cycles]);

  const styles = StyleSheet.create({
    container: {
      gap: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 32,
      gap: 16,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    regularityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 16,
    },
    regularityText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    regularityBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    regularityBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    fertilityScoreContainer: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 16,
    },
    fertilityScore: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    fertilityLabel: {
      fontSize: 14,
      color: colors.subtext,
      marginTop: 4,
    },
    riskContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    riskRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    riskLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    riskValue: {
      fontSize: 14,
      fontWeight: '600',
      marginRight: 8,
    },
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    riskBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    toggleButton: {
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    toggleButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    symptomContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    symptomItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    symptomName: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    symptomFrequency: {
      fontSize: 12,
      color: colors.subtext,
      marginRight: 8,
    },
    severityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    severityText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    telehealthContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    urgencyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    urgencyText: {
      fontSize: 16,
      fontWeight: '600',
    },
    recommendationText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    consultButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    consultButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    clinicalFlagsContainer: {
      backgroundColor: '#FFF3CD',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FFC107',
    },
    flagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    flagText: {
      fontSize: 14,
      color: '#856404',
      flex: 1,
    },
    recommendationsContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 12,
    },
    recommendationBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    recommendationItemText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      flex: 1,
    },
  });

  if (!clinicalAnalysis) {
    return (
      <InsightCard title="Clinical Insights">
        <View style={styles.emptyContainer}>
          <Activity size={48} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Track your cycles to unlock advanced clinical insights
          </Text>
        </View>
      </InsightCard>
    );
  }

  const { clinicalPrediction, symptomPatterns, telehealthRecommendations } = clinicalAnalysis;

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return colors.success;
    if (risk < 0.6) return colors.warning;
    return colors.error;
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'Low';
    if (risk < 0.6) return 'Moderate';
    return 'High';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      case 'urgent': return '#FF0000';
      default: return colors.text;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return colors.success;
      case 'moderate': return colors.warning;
      case 'severe': return colors.error;
      default: return colors.subtext;
    }
  };

  const handleScheduleConsultation = async () => {
    try {
      const providers = await TelehealthService.findProviders({
        telemedicineOnly: true,
        specialty: 'gynecology'
      });

      if (providers.length > 0) {
        Alert.alert(
          'Telehealth Consultation',
          `Found ${providers.length} available providers. Would you like to schedule a consultation?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Schedule', onPress: () => {
              // Navigate to scheduling screen
              console.log('Navigate to telehealth scheduling');
            }}
          ]
        );
      } else {
        Alert.alert('No Providers Available', 'No telehealth providers are currently available in your area.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to find healthcare providers at this time.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cycle Regularity */}
      <InsightCard title="Cycle Analysis">
        <View style={styles.regularityContainer}>
          <Text style={styles.regularityText}>Cycle Regularity</Text>
          <View style={[
            styles.regularityBadge,
            { backgroundColor: clinicalPrediction.cycleRegularity === 'regular' ? colors.success : 
              clinicalPrediction.cycleRegularity === 'irregular' ? colors.warning : colors.error }
          ]}>
            <Text style={styles.regularityBadgeText}>
              {clinicalPrediction.cycleRegularity.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.fertilityScoreContainer}>
          <Text style={styles.fertilityScore}>{clinicalPrediction.fertilityScore}</Text>
          <Text style={styles.fertilityLabel}>Fertility Score (out of 100)</Text>
        </View>
      </InsightCard>

      {/* Risk Assessment */}
      <InsightCard title="Health Risk Assessment">
        <View style={styles.riskContainer}>
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>PCOS Risk</Text>
            <Text style={[styles.riskValue, { color: getRiskColor(clinicalPrediction.riskAssessment.pcos) }]}>
              {Math.round(clinicalPrediction.riskAssessment.pcos * 100)}%
            </Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(clinicalPrediction.riskAssessment.pcos) }]}>
              <Text style={styles.riskBadgeText}>{getRiskLevel(clinicalPrediction.riskAssessment.pcos)}</Text>
            </View>
          </View>

          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Endometriosis Risk</Text>
            <Text style={[styles.riskValue, { color: getRiskColor(clinicalPrediction.riskAssessment.endometriosis) }]}>
              {Math.round(clinicalPrediction.riskAssessment.endometriosis * 100)}%
            </Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(clinicalPrediction.riskAssessment.endometriosis) }]}>
              <Text style={styles.riskBadgeText}>{getRiskLevel(clinicalPrediction.riskAssessment.endometriosis)}</Text>
            </View>
          </View>

          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Thyroid Issues</Text>
            <Text style={[styles.riskValue, { color: getRiskColor(clinicalPrediction.riskAssessment.thyroidIssues) }]}>
              {Math.round(clinicalPrediction.riskAssessment.thyroidIssues * 100)}%
            </Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(clinicalPrediction.riskAssessment.thyroidIssues) }]}>
              <Text style={styles.riskBadgeText}>{getRiskLevel(clinicalPrediction.riskAssessment.thyroidIssues)}</Text>
            </View>
          </View>

          {showDetailedRisks && (
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Ovulation Disorders</Text>
              <Text style={[styles.riskValue, { color: getRiskColor(clinicalPrediction.riskAssessment.ovulationDisorders) }]}>
                {Math.round(clinicalPrediction.riskAssessment.ovulationDisorders * 100)}%
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(clinicalPrediction.riskAssessment.ovulationDisorders) }]}>
                <Text style={styles.riskBadgeText}>{getRiskLevel(clinicalPrediction.riskAssessment.ovulationDisorders)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowDetailedRisks(!showDetailedRisks)}
          >
            <Text style={styles.toggleButtonText}>
              {showDetailedRisks ? 'Show Less' : 'Show More Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </InsightCard>

      {/* Clinical Flags */}
      {clinicalPrediction.clinicalFlags.length > 0 && (
        <View style={styles.clinicalFlagsContainer}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#856404" />
            <Text style={[styles.sectionTitle, { color: '#856404' }]}>Clinical Attention Needed</Text>
          </View>
          {clinicalPrediction.clinicalFlags.map((flag, index) => (
            <View key={index} style={styles.flagItem}>
              <AlertTriangle size={16} color="#856404" />
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Symptom Patterns */}
      {symptomPatterns.length > 0 && (
        <InsightCard title="Symptom Patterns">
          <View style={styles.symptomContainer}>
            {symptomPatterns.slice(0, 5).map((pattern, index) => (
              <View key={index} style={styles.symptomItem}>
                <Text style={styles.symptomName}>{pattern.symptom}</Text>
                <Text style={styles.symptomFrequency}>
                  {Math.round(pattern.frequency * 100)}%
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(pattern.severity) }]}>
                  <Text style={styles.severityText}>{pattern.severity.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        </InsightCard>
      )}

      {/* Telehealth Recommendations */}
      {telehealthRecommendations.shouldConsult && (
        <View style={styles.telehealthContainer}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Healthcare Consultation Recommended</Text>
          </View>

          <View style={styles.urgencyContainer}>
            <AlertTriangle size={16} color={getUrgencyColor(telehealthRecommendations.urgency)} />
            <Text style={[styles.urgencyText, { color: getUrgencyColor(telehealthRecommendations.urgency) }]}>
              {telehealthRecommendations.urgency.toUpperCase()} Priority
            </Text>
          </View>

          <Text style={styles.recommendationText}>
            Based on your cycle patterns and symptoms, we recommend consulting with a healthcare provider.
          </Text>

          {telehealthRecommendations.reasons.map((reason, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationBullet} />
              <Text style={styles.recommendationItemText}>{reason}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.consultButton} onPress={handleScheduleConsultation}>
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.consultButtonText}>Schedule Telehealth Consultation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Medical Recommendations */}
      {clinicalPrediction.recommendations.length > 0 && (
        <InsightCard title="Medical Recommendations">
          <View style={styles.recommendationsContainer}>
            {clinicalPrediction.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet} />
                <Text style={styles.recommendationItemText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </InsightCard>
      )}

      {/* Data Security Notice */}
      <View style={[styles.telehealthContainer, { borderLeftColor: colors.success }]}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color={colors.success} />
          <Text style={[styles.sectionTitle, { color: colors.success }]}>HIPAA Compliant</Text>
        </View>
        <Text style={[styles.recommendationText, { fontSize: 12, color: colors.subtext }]}>
          Your health data is encrypted and protected according to HIPAA standards. 
          All clinical insights are generated locally on your device for maximum privacy.
        </Text>
      </View>
    </ScrollView>
  );
}