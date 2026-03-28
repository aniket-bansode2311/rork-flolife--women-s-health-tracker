import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePeriodStore } from '@/store/periodStore';
import { MedicalReportGenerator, MedicalReport } from '@/utils/medicalReportGenerator';
import { 
  FileText, 
  Download, 
  Share2, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Heart,
  Brain,
  Shield,
  Calendar,
  Activity
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';

interface MedicalReportViewerProps {
  visible: boolean;
  onClose: () => void;
}

export default function MedicalReportViewer({ visible, onClose }: MedicalReportViewerProps) {
  const { colors } = useTheme();
  const { logs, cycles, profile } = usePeriodStore();
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    if (visible && !report) {
      generateReport();
    }
  }, [visible]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedReport = MedicalReportGenerator.generateComprehensiveReport(logs, cycles, profile);
      setReport(generatedReport);
    } catch (error) {
      console.error('Failed to generate report:', error);
      Alert.alert('Error', 'Failed to generate medical report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async () => {
    if (!report) return;

    try {
      const reportText = MedicalReportGenerator.exportReportAsText(report);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cyclix-medical-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const fileName = `cyclix-medical-report-${new Date().toISOString().split('T')[0]}.txt`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, reportText);
        
        await Share.share({
          url: fileUri,
          title: 'Cyclix Medical Report',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report.');
    }
  };

  const handleShareReport = async () => {
    if (!report) return;

    try {
      const reportText = MedicalReportGenerator.exportReportAsText(report);
      await Share.share({
        message: reportText,
        title: 'Cyclix Medical Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report.');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      case 'concerning': return colors.error;
      default: return colors.text;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return colors.success;
    if (risk < 0.6) return colors.warning;
    return colors.error;
  };

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
    headerActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: 14,
      color: colors.subtext,
      marginTop: 8,
      textAlign: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      color: colors.subtext,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    healthStatus: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
    },
    findingsList: {
      gap: 8,
    },
    findingItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    findingText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    urgentItem: {
      backgroundColor: '#FFF3CD',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    urgentText: {
      fontSize: 14,
      color: '#856404',
      fontWeight: '500',
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
    riskItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    riskLabel: {
      fontSize: 14,
      color: colors.text,
    },
    riskValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    recommendationItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    recommendationText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    qualityBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    qualityFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    qualityText: {
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'center',
    },
    reportInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    reportInfoText: {
      fontSize: 12,
      color: colors.subtext,
      lineHeight: 16,
    },
    disclaimer: {
      backgroundColor: '#FFF3CD',
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    disclaimerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#856404',
      marginBottom: 8,
    },
    disclaimerText: {
      fontSize: 12,
      color: '#856404',
      lineHeight: 16,
    },
  });

  if (!visible) return null;

  if (isGenerating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Generating Medical Report</Text>
          <Text style={styles.headerSubtitle}>Analyzing your health data...</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Creating Comprehensive Analysis</Text>
          <Text style={styles.loadingSubtext}>
            Processing {logs.length} entries and {cycles.length} cycles using advanced clinical algorithms
          </Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medical Report</Text>
          <Text style={styles.headerSubtitle}>Unable to generate report</Text>
        </View>
      </View>
    );
  }

  const renderSummarySection = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Heart size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Health Overview</Text>
        </View>
        
        <Text style={[styles.healthStatus, { color: getHealthStatusColor(report.executiveSummary.overallHealth) }]}>
          {report.executiveSummary.overallHealth.toUpperCase()}
        </Text>

        <View style={styles.reportInfo}>
          <Text style={styles.reportInfoText}>
            Report ID: {report.patientInfo.reportId}{'\n'}
            Generated: {new Date(report.patientInfo.reportDate).toLocaleDateString()}{'\n'}
            Data Range: {new Date(report.patientInfo.dataRange.startDate).toLocaleDateString()} - {new Date(report.patientInfo.dataRange.endDate).toLocaleDateString()} ({report.patientInfo.dataRange.totalDays} days)
          </Text>
        </View>

        {report.executiveSummary.urgentConcerns.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16 }]}>Urgent Concerns</Text>
            {report.executiveSummary.urgentConcerns.map((concern, index) => (
              <View key={index} style={styles.urgentItem}>
                <Text style={styles.urgentText}>⚠️ {concern}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16 }]}>Key Findings</Text>
        <View style={styles.findingsList}>
          {report.executiveSummary.keyFindings.map((finding, index) => (
            <View key={index} style={styles.findingItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.findingText}>{finding}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This report is generated by AI analysis and is for informational purposes only. 
          It should not replace professional medical advice, diagnosis, or treatment. 
          Always consult with qualified healthcare providers for medical concerns.
        </Text>
      </View>
    </ScrollView>
  );

  const renderCycleSection = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Cycle Analysis</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.cycleAnalysis.averageCycleLength}</Text>
            <Text style={styles.statLabel}>Avg Cycle{'\n'}Length (days)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.cycleAnalysis.averagePeriodLength}</Text>
            <Text style={styles.statLabel}>Avg Period{'\n'}Length (days)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.cycleAnalysis.variability}</Text>
            <Text style={styles.statLabel}>Cycle{'\n'}Variability</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.findingText, { fontWeight: '600', marginBottom: 8 }]}>
            Regularity: {report.cycleAnalysis.regularity}
          </Text>
          <Text style={styles.findingText}>
            Total Cycles Tracked: {report.cycleAnalysis.totalCyclesTracked}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16 }]}>Recent Cycle History</Text>
        {report.cycleAnalysis.cycleHistory.slice(0, 5).map((cycle, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.recommendationText}>
              Cycle {cycle.cycleNumber}: {cycle.length} days ({new Date(cycle.startDate).toLocaleDateString()})
              {cycle.notes && ` - ${cycle.notes}`}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderRiskSection = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
        </View>

        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>PCOS Risk</Text>
          <Text style={[styles.riskValue, { color: getRiskColor(report.riskAssessment.pcos.risk) }]}>
            {Math.round(report.riskAssessment.pcos.risk * 100)}%
          </Text>
        </View>

        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>Endometriosis Risk</Text>
          <Text style={[styles.riskValue, { color: getRiskColor(report.riskAssessment.endometriosis.risk) }]}>
            {Math.round(report.riskAssessment.endometriosis.risk * 100)}%
          </Text>
        </View>

        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>Thyroid Issues Risk</Text>
          <Text style={[styles.riskValue, { color: getRiskColor(report.riskAssessment.thyroidIssues.risk) }]}>
            {Math.round(report.riskAssessment.thyroidIssues.risk * 100)}%
          </Text>
        </View>

        <View style={[styles.riskItem, { borderBottomWidth: 0, marginTop: 16 }]}>
          <Text style={styles.riskLabel}>Fertility Score</Text>
          <Text style={[styles.riskValue, { color: colors.primary, fontSize: 18 }]}>
            {report.riskAssessment.fertilityScore}/100
          </Text>
        </View>

        {report.riskAssessment.fertilityFactors.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={[styles.findingText, { fontWeight: '600', marginBottom: 8 }]}>
              Fertility Factors:
            </Text>
            {report.riskAssessment.fertilityFactors.map((factor, index) => (
              <Text key={index} style={styles.findingText}>• {factor}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderRecommendationsSection = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Clinical Recommendations</Text>
        </View>

        {report.clinicalRecommendations.immediate.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16, color: colors.error }]}>
              Immediate Actions
            </Text>
            {report.clinicalRecommendations.immediate.map((rec, index) => (
              <View key={index} style={[styles.urgentItem, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.urgentText, { color: colors.error }]}>🚨 {rec}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16 }]}>Short-term (1-3 months)</Text>
        {report.clinicalRecommendations.shortTerm.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <TrendingUp size={16} color={colors.warning} />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16, marginTop: 16 }]}>
          Lifestyle Recommendations
        </Text>
        {report.clinicalRecommendations.lifestyle.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Heart size={16} color={colors.success} />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16, marginTop: 16 }]}>
          Medical Recommendations
        </Text>
        {report.clinicalRecommendations.medical.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Activity size={16} color={colors.primary} />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDataQualitySection = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Data Quality Assessment</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.statLabel}>Completeness</Text>
          <View style={styles.qualityBar}>
            <View style={[styles.qualityFill, { width: `${report.dataQuality.completeness}%` }]} />
          </View>
          <Text style={styles.qualityText}>{report.dataQuality.completeness}%</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.statLabel}>Consistency</Text>
          <View style={styles.qualityBar}>
            <View style={[styles.qualityFill, { width: `${report.dataQuality.consistency}%` }]} />
          </View>
          <Text style={styles.qualityText}>{report.dataQuality.consistency}%</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.statLabel}>Reliability</Text>
          <View style={styles.qualityBar}>
            <View style={[styles.qualityFill, { width: `${report.dataQuality.reliability}%` }]} />
          </View>
          <Text style={styles.qualityText}>{report.dataQuality.reliability}%</Text>
        </View>

        {report.dataQuality.recommendations.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 16 }]}>
              Data Quality Recommendations
            </Text>
            {report.dataQuality.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <TrendingUp size={16} color={colors.secondary} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Report</Text>
        <Text style={styles.headerSubtitle}>Comprehensive health analysis</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportReport}>
            <Download size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]} 
            onPress={handleShareReport}
          >
            <Share2 size={16} color={colors.text} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]} 
            onPress={onClose}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'summary' && styles.activeTab]}
          onPress={() => setActiveSection('summary')}
        >
          <Text style={[styles.tabText, activeSection === 'summary' && styles.activeTabText]}>
            Summary
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'cycle' && styles.activeTab]}
          onPress={() => setActiveSection('cycle')}
        >
          <Text style={[styles.tabText, activeSection === 'cycle' && styles.activeTabText]}>
            Cycle
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'risk' && styles.activeTab]}
          onPress={() => setActiveSection('risk')}
        >
          <Text style={[styles.tabText, activeSection === 'risk' && styles.activeTabText]}>
            Risk
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveSection('recommendations')}
        >
          <Text style={[styles.tabText, activeSection === 'recommendations' && styles.activeTabText]}>
            Actions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'quality' && styles.activeTab]}
          onPress={() => setActiveSection('quality')}
        >
          <Text style={[styles.tabText, activeSection === 'quality' && styles.activeTabText]}>
            Quality
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'summary' && renderSummarySection()}
      {activeSection === 'cycle' && renderCycleSection()}
      {activeSection === 'risk' && renderRiskSection()}
      {activeSection === 'recommendations' && renderRecommendationsSection()}
      {activeSection === 'quality' && renderDataQualitySection()}
    </View>
  );
}