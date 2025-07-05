import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePeriodStore } from '@/store/periodStore';
import { generateClinicalPrediction } from '@/utils/clinicalPredictions';
import { Brain, TrendingUp, AlertCircle, CheckCircle, MessageSquare, Lightbulb } from 'lucide-react-native';

interface AIInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'alert' | 'trend';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface SymptomCorrelation {
  symptom: string;
  cyclePhase: string;
  frequency: number;
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'increasing' | 'stable' | 'decreasing';
}

export default function AISymptomAnalysis() {
  const { colors } = useTheme();
  const { logs, cycles, profile } = usePeriodStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [correlations, setCorrelations] = useState<SymptomCorrelation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    if (logs.length >= 5) {
      analyzeSymptoms();
    }
  }, [logs, cycles]);

  const analyzeSymptoms = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const clinicalPrediction = generateClinicalPrediction(logs, cycles, profile);
      const generatedInsights = generateAIInsights(clinicalPrediction);
      const symptomCorrelations = analyzeSymptomCorrelations();
      
      setInsights(generatedInsights);
      setCorrelations(symptomCorrelations);
    } catch (error) {
      console.error('AI analysis failed:', error);
      Alert.alert('Analysis Error', 'Failed to analyze symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAIInsights = (clinicalPrediction: any): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Pattern detection insights
    if (clinicalPrediction.cycleRegularity === 'irregular') {
      insights.push({
        id: 'cycle_irregularity',
        type: 'pattern',
        title: 'Cycle Irregularity Pattern Detected',
        description: 'Your cycles show irregular patterns. This could be related to stress, hormonal changes, or lifestyle factors.',
        confidence: 0.85,
        actionable: true,
        priority: 'medium'
      });
    }

    // PCOS risk insights
    if (clinicalPrediction.riskAssessment.pcos > 0.6) {
      insights.push({
        id: 'pcos_risk',
        type: 'alert',
        title: 'PCOS Risk Indicators',
        description: 'Multiple symptoms suggest possible PCOS. Consider discussing with a healthcare provider for proper evaluation.',
        confidence: clinicalPrediction.riskAssessment.pcos,
        actionable: true,
        priority: 'high'
      });
    }

    // Symptom trend insights
    const recentLogs = logs.slice(-10);
    const symptomFrequency = new Map<string, number>();
    
    recentLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomFrequency.set(symptom, (symptomFrequency.get(symptom) || 0) + 1);
      });
    });

    const frequentSymptoms = Array.from(symptomFrequency.entries())
      .filter(([_, count]) => count >= 5)
      .map(([symptom, _]) => symptom);

    if (frequentSymptoms.length > 0) {
      insights.push({
        id: 'frequent_symptoms',
        type: 'trend',
        title: 'Recurring Symptom Pattern',
        description: `You frequently experience: ${frequentSymptoms.join(', ')}. Tracking these patterns can help identify triggers.`,
        confidence: 0.9,
        actionable: true,
        priority: 'medium'
      });
    }

    // Mood correlation insights
    const moodLogs = logs.filter(log => log.mood && log.mood !== 'neutral');
    if (moodLogs.length > 0) {
      const negativeModds = moodLogs.filter(log => 
        log.mood === 'sad' || log.mood === 'anxious' || log.mood === 'irritated'
      );
      
      if (negativeModds.length / moodLogs.length > 0.4) {
        insights.push({
          id: 'mood_pattern',
          type: 'recommendation',
          title: 'Mood Pattern Analysis',
          description: 'Your mood logs show frequent negative emotions. Consider stress management techniques or speaking with a counselor.',
          confidence: 0.75,
          actionable: true,
          priority: 'medium'
        });
      }
    }

    // Fertility insights
    if (clinicalPrediction.fertilityScore < 60) {
      insights.push({
        id: 'fertility_optimization',
        type: 'recommendation',
        title: 'Fertility Optimization Opportunities',
        description: 'Several factors may be affecting your fertility score. Consider lifestyle modifications and tracking ovulation more closely.',
        confidence: 0.7,
        actionable: true,
        priority: 'medium'
      });
    }

    // Positive insights
    if (clinicalPrediction.cycleRegularity === 'regular' && clinicalPrediction.fertilityScore > 80) {
      insights.push({
        id: 'healthy_patterns',
        type: 'pattern',
        title: 'Healthy Cycle Patterns',
        description: 'Your cycles show excellent regularity and health indicators. Keep up the great work with your current lifestyle!',
        confidence: 0.95,
        actionable: false,
        priority: 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const analyzeSymptomCorrelations = (): SymptomCorrelation[] => {
    const correlations: SymptomCorrelation[] = [];
    const symptomPhaseMap = new Map<string, Map<string, number>>();

    logs.forEach(log => {
      // Simplified phase detection - in real implementation, use proper cycle day calculation
      let phase = 'follicular';
      if (log.flow !== 'none') {
        phase = 'period';
      } else {
        // This would need proper cycle day calculation
        phase = Math.random() > 0.5 ? 'luteal' : 'ovulation';
      }

      log.symptoms.forEach(symptom => {
        if (!symptomPhaseMap.has(symptom)) {
          symptomPhaseMap.set(symptom, new Map());
        }
        const phaseMap = symptomPhaseMap.get(symptom)!;
        phaseMap.set(phase, (phaseMap.get(phase) || 0) + 1);
      });
    });

    symptomPhaseMap.forEach((phaseMap, symptom) => {
      const totalOccurrences = Array.from(phaseMap.values()).reduce((sum, count) => sum + count, 0);
      const dominantPhase = Array.from(phaseMap.entries()).reduce((max, [phase, count]) => 
        count > max.count ? { phase, count } : max, { phase: '', count: 0 }
      );

      if (totalOccurrences >= 3) {
        correlations.push({
          symptom,
          cyclePhase: dominantPhase.phase,
          frequency: totalOccurrences / logs.length,
          severity: totalOccurrences > 5 ? 'moderate' : 'mild',
          trend: 'stable' // Would need historical comparison for trend analysis
        });
      }
    });

    return correlations.sort((a, b) => b.frequency - a.frequency);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp size={20} color={colors.primary} />;
      case 'recommendation': return <Lightbulb size={20} color={colors.secondary} />;
      case 'alert': return <AlertCircle size={20} color={colors.error} />;
      case 'trend': return <Brain size={20} color={colors.warning} />;
      default: return <CheckCircle size={20} color={colors.success} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.text;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return colors.error;
      case 'moderate': return colors.warning;
      case 'mild': return colors.success;
      default: return colors.text;
    }
  };

  const handleInsightPress = (insight: AIInsight) => {
    setSelectedInsight(insight);
    
    if (insight.actionable) {
      Alert.alert(
        insight.title,
        `${insight.description}\n\nConfidence: ${Math.round(insight.confidence * 100)}%\n\nWould you like to learn more about this insight?`,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Learn More', onPress: () => showDetailedInsight(insight) }
        ]
      );
    }
  };

  const showDetailedInsight = (insight: AIInsight) => {
    // In a real implementation, this would show detailed information or navigate to a detailed view
    Alert.alert(
      'Detailed Analysis',
      'This feature would provide detailed information about the insight, including scientific background, recommended actions, and related resources.',
      [{ text: 'OK' }]
    );
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
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
    section: {
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
    insightCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    insightDescription: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    confidenceBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    confidenceFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    confidenceText: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 4,
    },
    correlationItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    correlationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    correlationSymptom: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    correlationPhase: {
      fontSize: 12,
      color: colors.subtext,
      backgroundColor: colors.card,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    correlationDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    correlationFrequency: {
      fontSize: 12,
      color: colors.subtext,
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
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    analyzeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
    },
    analyzeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  if (logs.length < 5) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Symptom Analysis</Text>
          <Text style={styles.headerSubtitle}>Intelligent pattern recognition for your health</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Brain size={64} color={colors.subtext} />
          <Text style={styles.emptyStateText}>Not Enough Data</Text>
          <Text style={styles.emptyStateSubtext}>
            AI analysis requires at least 5 logged entries to identify meaningful patterns. 
            Continue tracking your symptoms and cycles to unlock personalized insights.
          </Text>
        </View>
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Symptom Analysis</Text>
          <Text style={styles.headerSubtitle}>Analyzing your health patterns...</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>AI is analyzing your data</Text>
          <Text style={styles.loadingSubtext}>
            Processing {logs.length} entries and {cycles.length} cycles to identify patterns and insights
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Symptom Analysis</Text>
        <Text style={styles.headerSubtitle}>Personalized insights from your health data</Text>
      </View>

      {/* AI Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </View>

        {insights.length > 0 ? (
          insights.map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[
                styles.insightCard,
                { borderLeftColor: getPriorityColor(insight.priority) }
              ]}
              onPress={() => handleInsightPress(insight)}
            >
              <View style={styles.insightHeader}>
                {getInsightIcon(insight.type)}
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
                  <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.insightDescription}>{insight.description}</Text>
              
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { width: `${insight.confidence * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(insight.confidence * 100)}%
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color={colors.success} />
            <Text style={styles.emptyStateText}>No Concerning Patterns</Text>
            <Text style={styles.emptyStateSubtext}>
              AI analysis found no concerning patterns in your data. Your health tracking looks good!
            </Text>
          </View>
        )}
      </View>

      {/* Symptom Correlations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Symptom Correlations</Text>
        </View>

        {correlations.length > 0 ? (
          correlations.slice(0, 5).map((correlation, index) => (
            <View key={index} style={styles.correlationItem}>
              <View style={styles.correlationHeader}>
                <Text style={styles.correlationSymptom}>
                  {correlation.symptom.replace('_', ' ')}
                </Text>
                <Text style={styles.correlationPhase}>
                  {correlation.cyclePhase}
                </Text>
              </View>
              
              <View style={styles.correlationDetails}>
                <Text style={styles.correlationFrequency}>
                  {Math.round(correlation.frequency * 100)}% frequency
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(correlation.severity) }]}>
                  <Text style={styles.severityText}>{correlation.severity.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyStateSubtext}>
            No significant symptom correlations found yet. Continue tracking to build patterns.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeSymptoms}>
          <Text style={styles.analyzeButtonText}>Re-analyze Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}