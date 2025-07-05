import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import symptoms from '@/constants/symptoms';
import moods from '@/constants/moods';
import { predictCycleIrregularities, getPredictionAccuracy } from '@/utils/mlPredictions';
import AdvancedClinicalInsights from '@/components/AdvancedClinicalInsights';
import TelehealthBooking from '@/components/TelehealthBooking';
import AISymptomAnalysis from '@/components/AISymptomAnalysis';
import { AlertTriangle, Stethoscope, Brain } from 'lucide-react-native';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const { logs, cycles, profile } = usePeriodStore();
  const [activeTab, setActiveTab] = useState('cycle');
  const [showTelehealthBooking, setShowTelehealthBooking] = useState(false);
  
  // Get ML predictions
  const predictions = predictCycleIrregularities(logs, cycles);
  const accuracy = getPredictionAccuracy(logs, cycles);
  const accuracyPercentage = Math.round(accuracy * 100);
  
  // Calculate symptom statistics
  const symptomStats: Record<string, number> = {};
  logs.forEach(log => {
    log.symptoms.forEach(symptomId => {
      symptomStats[symptomId] = (symptomStats[symptomId] || 0) + 1;
    });
  });
  
  const sortedSymptoms = Object.entries(symptomStats)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      count,
      name: symptoms.find(s => s.id === id)?.name || id,
    }));
  
  // Calculate mood statistics
  const moodStats: Record<string, number> = {};
  logs.forEach(log => {
    if (log.mood) {
      moodStats[log.mood] = (moodStats[log.mood] || 0) + 1;
    }
  });
  
  const sortedMoods = Object.entries(moodStats)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      count,
      name: moods.find(m => m.id === id)?.name || id,
    }));

  // Get all period groups from logs for better history display
  const getPeriodGroups = () => {
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const periodGroups: { start: string; end: string; logs: any[]; length: number }[] = [];
    let currentGroup: { start: string; end: string; logs: any[] } | null = null;
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const currentDate = new Date(log.date);
      
      if (log.flow !== 'none') {
        if (!currentGroup) {
          currentGroup = { 
            start: log.date, 
            end: log.date, 
            logs: [log] 
          };
        } else {
          const lastDate = new Date(currentGroup.end);
          const daysDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 2) {
            currentGroup.end = log.date;
            currentGroup.logs.push(log);
          } else {
            const periodLength = Math.round(
              (new Date(currentGroup.end).getTime() - new Date(currentGroup.start).getTime()) / 
              (1000 * 60 * 60 * 24)
            ) + 1;
            
            periodGroups.push({
              ...currentGroup,
              length: periodLength
            });
            
            currentGroup = { 
              start: log.date, 
              end: log.date, 
              logs: [log] 
            };
          }
        }
      } else if (currentGroup) {
        const lastDate = new Date(currentGroup.end);
        const daysDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 2) {
          const periodLength = Math.round(
            (new Date(currentGroup.end).getTime() - new Date(currentGroup.start).getTime()) / 
            (1000 * 60 * 60 * 24)
          ) + 1;
          
          periodGroups.push({
            ...currentGroup,
            length: periodLength
          });
          currentGroup = null;
        }
      }
    }
    
    if (currentGroup) {
      const periodLength = Math.round(
        (new Date(currentGroup.end).getTime() - new Date(currentGroup.start).getTime()) / 
        (1000 * 60 * 60 * 24)
      ) + 1;
      
      periodGroups.push({
        ...currentGroup,
        length: periodLength
      });
    }
    
    return periodGroups.reverse(); // Most recent first
  };

  const periodGroups = getPeriodGroups();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      minWidth: 80,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.subtext,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    tabContent: {
      flex: 1,
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
    },
    cycleItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    cycleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    cycleDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    cycleLength: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    cycleDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cycleDetailText: {
      fontSize: 14,
      color: colors.subtext,
    },
    symptomItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    symptomRank: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    symptomInfo: {
      flex: 1,
      marginRight: 12,
    },
    symptomName: {
      fontSize: 16,
      color: colors.text,
      textTransform: 'capitalize',
    },
    symptomCount: {
      fontSize: 14,
      color: colors.subtext,
    },
    percentBar: {
      height: 8,
      width: '30%',
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    percentFill: {
      height: '100%',
    },
    emptyText: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      padding: 16,
    },
    irregularityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    irregularityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    accuracyBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    accuracyText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    irregularityItem: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    irregularityReason: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    irregularitySuggestion: {
      fontSize: 14,
      color: colors.subtext,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    confidenceBar: {
      height: 20,
      backgroundColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    },
    confidenceFill: {
      height: '100%',
      backgroundColor: colors.warning,
      position: 'absolute',
      left: 0,
      top: 0,
    },
    confidenceText: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    mlInfoBox: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    mlInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    mlInfoText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    predictionsSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    predictionItem: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    predictionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    predictionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    confidenceBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    confidenceBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    predictionReason: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    suggestionBox: {
      backgroundColor: 'rgba(0,0,0,0.03)',
      borderRadius: 8,
      padding: 12,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.subtext,
      fontStyle: 'italic',
    },
    noPredictionsBox: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    noPredictionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    noPredictionsText: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    dataProgressBar: {
      height: 8,
      width: '100%',
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    dataProgressFill: {
      height: '100%',
      backgroundColor: colors.secondary,
    },
    dataProgressText: {
      fontSize: 12,
      color: colors.subtext,
    },
    periodItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    periodHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    periodDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    periodLength: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    periodDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    periodDetailText: {
      fontSize: 14,
      color: colors.subtext,
    },
  });
  
  const renderCycleTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Cycle Summary</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.cycleAvgLength}</Text>
            <Text style={styles.statLabel}>Avg. Cycle Length</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.periodAvgLength}</Text>
            <Text style={styles.statLabel}>Avg. Period Length</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cycles.length}</Text>
            <Text style={styles.statLabel}>Complete Cycles</Text>
          </View>
        </View>
      </View>
      
      {predictions.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.irregularityHeader}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.irregularityTitle}>AI Analysis Results</Text>
            <View style={styles.accuracyBadge}>
              <Text style={styles.accuracyText}>{accuracyPercentage}% accuracy</Text>
            </View>
          </View>
          
          {predictions.map((prediction, index) => (
            <View key={index} style={styles.irregularityItem}>
              <Text style={styles.irregularityReason}>{prediction.reason}</Text>
              {prediction.suggestedAction && (
                <Text style={styles.irregularitySuggestion}>
                  {prediction.suggestedAction}
                </Text>
              )}
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { width: `${prediction.confidence * 100}%` }
                  ]} 
                />
                <Text style={styles.confidenceText}>
                  {Math.round(prediction.confidence * 100)}% confidence
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Period History ({periodGroups.length} periods tracked)</Text>
        
        {periodGroups.length > 0 ? (
          periodGroups.map((period, index) => (
            <View key={index} style={styles.periodItem}>
              <View style={styles.periodHeader}>
                <Text style={styles.periodDate}>
                  Period {periodGroups.length - index}
                </Text>
                <Text style={styles.periodLength}>
                  {period.length} days
                </Text>
              </View>
              
              <View style={styles.periodDetails}>
                <Text style={styles.periodDetailText}>
                  Started: {new Date(period.start).toLocaleDateString()}
                </Text>
                <Text style={styles.periodDetailText}>
                  Ended: {new Date(period.end).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No period history available yet
          </Text>
        )}
      </View>

      {cycles.length > 0 && (
        <View style={styles.insightCard}>
          <Text style={styles.cardTitle}>Complete Cycle History ({cycles.length} cycles)</Text>
          
          {cycles.map((cycle, index) => (
            <View key={index} style={styles.cycleItem}>
              <View style={styles.cycleHeader}>
                <Text style={styles.cycleDate}>
                  Cycle {cycles.length - index}
                </Text>
                <Text style={styles.cycleLength}>
                  {cycle.length} days
                </Text>
              </View>
              
              <View style={styles.cycleDetails}>
                <Text style={styles.cycleDetailText}>
                  Started: {new Date(cycle.startDate).toLocaleDateString()}
                </Text>
                <Text style={styles.cycleDetailText}>
                  Period: {cycle.periodLength} days
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
  
  const renderSymptomsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Symptom Summary</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Object.keys(symptomStats).length}
            </Text>
            <Text style={styles.statLabel}>Different Symptoms</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {logs.reduce((count, log) => count + log.symptoms.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Tracked</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Most Common Symptoms</Text>
        
        {sortedSymptoms.length > 0 ? (
          sortedSymptoms.map((symptom, index) => (
            <View key={symptom.id} style={styles.symptomItem}>
              <View style={styles.symptomRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomName}>
                  {symptom.name || symptom.id.replace('_', ' ')}
                </Text>
                <Text style={styles.symptomCount}>
                  {symptom.count} {symptom.count === 1 ? 'time' : 'times'}
                </Text>
              </View>
              
              <View style={styles.percentBar}>
                <View 
                  style={[
                    styles.percentFill, 
                    { 
                      width: `${(symptom.count / logs.length) * 100}%`,
                      backgroundColor: colors.primary,
                    }
                  ]} 
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No symptom data available yet
          </Text>
        )}
      </View>
    </View>
  );
  
  const renderMoodsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Mood Summary</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Object.keys(moodStats).length}
            </Text>
            <Text style={styles.statLabel}>Different Moods</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {logs.filter(log => log.mood).length}
            </Text>
            <Text style={styles.statLabel}>Total Tracked</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>Most Common Moods</Text>
        
        {sortedMoods.length > 0 ? (
          sortedMoods.map((mood, index) => (
            <View key={mood.id} style={styles.symptomItem}>
              <View style={[styles.symptomRank, { backgroundColor: colors.secondary }]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomName}>
                  {mood.name || mood.id.charAt(0).toUpperCase() + mood.id.slice(1)}
                </Text>
                <Text style={styles.symptomCount}>
                  {mood.count} {mood.count === 1 ? 'time' : 'times'}
                </Text>
              </View>
              
              <View style={styles.percentBar}>
                <View 
                  style={[
                    styles.percentFill, 
                    { 
                      width: `${(mood.count / logs.length) * 100}%`,
                      backgroundColor: colors.secondary,
                    }
                  ]} 
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No mood data available yet
          </Text>
        )}
      </View>
    </View>
  );
  
  const renderPredictionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>AI Prediction Engine</Text>
        
        <View style={styles.mlInfoBox}>
          <Text style={styles.mlInfoTitle}>How Cyclix AI Works</Text>
          <Text style={styles.mlInfoText}>
            Our advanced machine learning model analyzes your cycle data, symptoms, and patterns to detect potential irregularities with {accuracyPercentage}% accuracy.
          </Text>
          <Text style={styles.mlInfoText}>
            The more historical data you provide, the more accurate our predictions become.
          </Text>
        </View>
        
        {predictions.length > 0 ? (
          <>
            <Text style={styles.predictionsSectionTitle}>Detected Patterns</Text>
            {predictions.map((prediction, index) => (
              <View key={index} style={styles.predictionItem}>
                <View style={styles.predictionHeader}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <Text style={styles.predictionTitle}>Pattern {index + 1}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceBadgeText}>
                      {Math.round(prediction.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.predictionReason}>{prediction.reason}</Text>
                
                {prediction.suggestedAction && (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionText}>{prediction.suggestedAction}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.noPredictionsBox}>
            {logs.length < 15 || cycles.length < 3 ? (
              <>
                <Text style={styles.noPredictionsTitle}>Building AI Model</Text>
                <Text style={styles.noPredictionsText}>
                  Continue logging your cycle data. Our AI model needs at least 3 cycles and 15 logs to provide accurate predictions.
                </Text>
                <View style={styles.dataProgressBar}>
                  <View 
                    style={[
                      styles.dataProgressFill, 
                      { width: `${Math.min(Math.round((logs.length / 15) * 100), 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.dataProgressText}>
                  {Math.min(Math.round((logs.length / 15) * 100), 100)}% of required data collected
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.noPredictionsTitle}>Healthy Cycle Detected</Text>
                <Text style={styles.noPredictionsText}>
                  Based on your logged data, your cycle appears to be regular. Continue logging to maintain accurate predictions.
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Health Insights',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
        }} 
      />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cycle' && styles.activeTab]}
          onPress={() => setActiveTab('cycle')}
        >
          <Text style={[styles.tabText, activeTab === 'cycle' && styles.activeTabText]}>
            Cycle
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'symptoms' && styles.activeTab]}
          onPress={() => setActiveTab('symptoms')}
        >
          <Text style={[styles.tabText, activeTab === 'symptoms' && styles.activeTabText]}>
            Symptoms
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'moods' && styles.activeTab]}
          onPress={() => setActiveTab('moods')}
        >
          <Text style={[styles.tabText, activeTab === 'moods' && styles.activeTabText]}>
            Moods
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
          onPress={() => setActiveTab('predictions')}
        >
          <Text style={[styles.tabText, activeTab === 'predictions' && styles.activeTabText]}>
            AI Analysis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clinical' && styles.activeTab]}
          onPress={() => setActiveTab('clinical')}
        >
          <Text style={[styles.tabText, activeTab === 'clinical' && styles.activeTabText]}>
            Clinical
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            AI Analysis
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'cycle' && renderCycleTab()}
        {activeTab === 'symptoms' && renderSymptomsTab()}
        {activeTab === 'moods' && renderMoodsTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
        {activeTab === 'clinical' && <AdvancedClinicalInsights />}
        {activeTab === 'ai' && <AISymptomAnalysis />}
      </ScrollView>
      
      <TelehealthBooking 
        visible={showTelehealthBooking}
        onClose={() => setShowTelehealthBooking(false)}
      />
    </View>
  );
}