import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { notificationManager, NotificationSettings, defaultNotificationSettings } from '@/utils/notifications';
import { usePeriodStore } from '@/store/periodStore';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Bell, Clock, Droplet, Heart, Activity, Pill } from 'lucide-react-native';

export default function NotificationSettingsComponent() {
  const { colors } = useTheme();
  const { logs, cycles, profile } = usePeriodStore();
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load current settings
    const currentSettings = notificationManager.getSettings();
    setSettings(currentSettings);
    
    // Check permission status
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      if (Platform.OS === 'web') {
        const permission = 'Notification' in window ? Notification.permission : 'denied';
        setPermissionGranted(permission === 'granted');
      } else {
        // For native, we'll assume permission is granted if notifications are enabled
        setPermissionGranted(true);
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setPermissionGranted(false);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationManager.requestPermissions();
      setPermissionGranted(granted);
      
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permission');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
    
    // Re-schedule notifications with new settings
    notificationManager.scheduleAllNotifications(logs, cycles, profile);
  };

  const testNotification = async () => {
    try {
      await notificationManager.sendImmediateNotification(
        'Test Notification',
        'This is a test notification from Cyclix!'
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 20,
    },
    permissionSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: permissionGranted ? colors.success : colors.warning,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    permissionText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.subtext,
    },
    numberInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    numberInput: {
      width: 60,
    },
    numberInputLabel: {
      fontSize: 14,
      color: colors.text,
    },
    testSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    testButton: {
      marginTop: 12,
    },
  });

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    numberInput?: {
      value: number;
      onChangeText: (value: number) => void;
      label: string;
      min?: number;
      max?: number;
    }
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
          {numberInput && value && (
            <View style={styles.numberInputContainer}>
              <Input
                style={styles.numberInput}
                value={numberInput.value.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || numberInput.min || 1;
                  const clampedNum = Math.max(
                    numberInput.min || 1,
                    Math.min(numberInput.max || 100, num)
                  );
                  numberInput.onChangeText(clampedNum);
                }}
                keyboardType="numeric"
                placeholder="1"
              />
              <Text style={styles.numberInputLabel}>{numberInput.label}</Text>
            </View>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.card : colors.subtext}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      <Text style={styles.subtitle}>
        Customize your reminders and alerts
      </Text>

      {/* Permission Section */}
      <View style={styles.permissionSection}>
        <Text style={styles.permissionTitle}>
          {permissionGranted ? '✅ Notifications Enabled' : '⚠️ Permission Required'}
        </Text>
        <Text style={styles.permissionText}>
          {permissionGranted
            ? 'You will receive notifications based on your settings below.'
            : 'Enable notifications to receive period reminders, fertility alerts, and health insights.'
          }
        </Text>
        {!permissionGranted && (
          <Button
            title="Enable Notifications"
            onPress={requestPermission}
            loading={isLoading}
          />
        )}
      </View>

      {/* Notification Settings */}
      {renderSettingItem(
        <Droplet size={20} color={colors.primary} />,
        'Period Reminders',
        'Get notified before your period starts',
        settings.periodReminder,
        (value) => updateSetting('periodReminder', value),
        {
          value: settings.periodReminderDays,
          onChangeText: (value) => updateSetting('periodReminderDays', value),
          label: 'days before',
          min: 1,
          max: 7,
        }
      )}

      {renderSettingItem(
        <Heart size={20} color={colors.secondary} />,
        'Fertility Reminders',
        'Get notified about your fertile window',
        settings.fertilityReminder,
        (value) => updateSetting('fertilityReminder', value),
        {
          value: settings.fertilityReminderDays,
          onChangeText: (value) => updateSetting('fertilityReminderDays', value),
          label: 'days before',
          min: 1,
          max: 5,
        }
      )}

      {renderSettingItem(
        <Activity size={20} color={colors.success} />,
        'Ovulation Alerts',
        'Get notified on your ovulation day',
        settings.ovulationReminder,
        (value) => updateSetting('ovulationReminder', value)
      )}

      {renderSettingItem(
        <Bell size={20} color={colors.text} />,
        'Daily Check-in',
        'Reminder to log symptoms and mood',
        settings.symptomReminder,
        (value) => updateSetting('symptomReminder', value)
      )}

      {renderSettingItem(
        <Clock size={20} color={colors.info} />,
        'Water Reminders',
        'Stay hydrated throughout the day',
        settings.waterReminder,
        (value) => updateSetting('waterReminder', value),
        {
          value: settings.waterReminderInterval,
          onChangeText: (value) => updateSetting('waterReminderInterval', value),
          label: 'hours apart',
          min: 1,
          max: 8,
        }
      )}

      {renderSettingItem(
        <Pill size={20} color={colors.warning} />,
        'Medication Reminders',
        'Reminders for birth control or supplements',
        settings.medicationReminder,
        (value) => updateSetting('medicationReminder', value)
      )}

      {/* Test Section */}
      {permissionGranted && (
        <View style={styles.testSection}>
          <Text style={styles.settingTitle}>Test Notifications</Text>
          <Text style={styles.settingDescription}>
            Send a test notification to make sure everything is working
          </Text>
          <Button
            title="Send Test Notification"
            onPress={testNotification}
            variant="outline"
            style={styles.testButton}
          />
        </View>
      )}
    </View>
  );
}