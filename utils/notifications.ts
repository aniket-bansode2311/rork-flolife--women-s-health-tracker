import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { generateEnhancedPrediction } from './enhancedPredictions';
import { PeriodLog, CycleData, UserProfile } from '@/types/period';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  periodReminder: boolean;
  fertilityReminder: boolean;
  ovulationReminder: boolean;
  symptomReminder: boolean;
  waterReminder: boolean;
  medicationReminder: boolean;
  periodReminderDays: number; // Days before predicted period
  fertilityReminderDays: number; // Days before fertile window
  waterReminderInterval: number; // Hours between water reminders
}

export const defaultNotificationSettings: NotificationSettings = {
  periodReminder: true,
  fertilityReminder: true,
  ovulationReminder: true,
  symptomReminder: true,
  waterReminder: false,
  medicationReminder: false,
  periodReminderDays: 2,
  fertilityReminderDays: 1,
  waterReminderInterval: 2,
};

// Notification types
export enum NotificationType {
  PERIOD_REMINDER = 'period_reminder',
  FERTILITY_REMINDER = 'fertility_reminder',
  OVULATION_REMINDER = 'ovulation_reminder',
  SYMPTOM_REMINDER = 'symptom_reminder',
  WATER_REMINDER = 'water_reminder',
  MEDICATION_REMINDER = 'medication_reminder',
  PERIOD_LATE = 'period_late',
  CYCLE_IRREGULAR = 'cycle_irregular',
}

export class NotificationManager {
  private static instance: NotificationManager;
  private settings: NotificationSettings = defaultNotificationSettings;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web notification permissions
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      } else {
        // Native notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        return finalStatus === 'granted';
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Update notification settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.scheduleAllNotifications();
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Schedule all notifications based on current data
  async scheduleAllNotifications(
    logs?: PeriodLog[],
    cycles?: CycleData[],
    profile?: UserProfile
  ): Promise<void> {
    try {
      // Cancel all existing notifications
      await this.cancelAllNotifications();

      if (!logs || !cycles || !profile) {
        return;
      }

      // Generate predictions
      const prediction = generateEnhancedPrediction(logs, cycles, profile);
      if (!prediction) {
        return;
      }

      // Schedule period reminder
      if (this.settings.periodReminder) {
        await this.schedulePeriodReminder(prediction.nextPeriodDate);
      }

      // Schedule fertility reminders
      if (this.settings.fertilityReminder) {
        await this.scheduleFertilityReminder(prediction.fertileWindow.start);
      }

      // Schedule ovulation reminder
      if (this.settings.ovulationReminder) {
        await this.scheduleOvulationReminder(prediction.fertileWindow.ovulationDate);
      }

      // Schedule symptom reminder
      if (this.settings.symptomReminder) {
        await this.scheduleSymptomReminder();
      }

      // Schedule water reminders
      if (this.settings.waterReminder) {
        await this.scheduleWaterReminders();
      }

      // Check for late period
      await this.checkLatePeroid(prediction.nextPeriodDate);

    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  // Schedule period reminder
  private async schedulePeriodReminder(nextPeriodDate: string): Promise<void> {
    const reminderDate = new Date(nextPeriodDate);
    reminderDate.setDate(reminderDate.getDate() - this.settings.periodReminderDays);
    
    if (reminderDate > new Date()) {
      await this.scheduleNotification({
        identifier: NotificationType.PERIOD_REMINDER,
        title: '🩸 Period Reminder',
        body: `Your period is expected in ${this.settings.periodReminderDays} day${this.settings.periodReminderDays > 1 ? 's' : ''}. Time to prepare!`,
        trigger: reminderDate,
        data: { type: NotificationType.PERIOD_REMINDER }
      });
    }
  }

  // Schedule fertility reminder
  private async scheduleFertilityReminder(fertileWindowStart: string): Promise<void> {
    const reminderDate = new Date(fertileWindowStart);
    reminderDate.setDate(reminderDate.getDate() - this.settings.fertilityReminderDays);
    
    if (reminderDate > new Date()) {
      await this.scheduleNotification({
        identifier: NotificationType.FERTILITY_REMINDER,
        title: '🌸 Fertility Window',
        body: `Your fertile window starts in ${this.settings.fertilityReminderDays} day${this.settings.fertilityReminderDays > 1 ? 's' : ''}!`,
        trigger: reminderDate,
        data: { type: NotificationType.FERTILITY_REMINDER }
      });
    }
  }

  // Schedule ovulation reminder
  private async scheduleOvulationReminder(ovulationDate: string): Promise<void> {
    const reminderDate = new Date(ovulationDate);
    
    if (reminderDate > new Date()) {
      await this.scheduleNotification({
        identifier: NotificationType.OVULATION_REMINDER,
        title: '🥚 Ovulation Day',
        body: 'Today is your predicted ovulation day. Peak fertility!',
        trigger: reminderDate,
        data: { type: NotificationType.OVULATION_REMINDER }
      });
    }
  }

  // Schedule daily symptom reminder
  private async scheduleSymptomReminder(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0); // 8 PM daily
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await this.scheduleRepeatingNotification({
      identifier: NotificationType.SYMPTOM_REMINDER,
      title: '📝 Daily Check-in',
      body: 'How are you feeling today? Log your symptoms and mood.',
      hour: 20,
      minute: 0,
      data: { type: NotificationType.SYMPTOM_REMINDER }
    });
  }

  // Schedule water reminders
  private async scheduleWaterReminders(): Promise<void> {
    const startHour = 8; // 8 AM
    const endHour = 22; // 10 PM
    
    for (let hour = startHour; hour <= endHour; hour += this.settings.waterReminderInterval) {
      await this.scheduleRepeatingNotification({
        identifier: `${NotificationType.WATER_REMINDER}_${hour}`,
        title: '💧 Hydration Reminder',
        body: 'Time to drink some water! Stay hydrated for better health.',
        hour: hour,
        minute: 0,
        data: { type: NotificationType.WATER_REMINDER }
      });
    }
  }

  // Check for late period
  private async checkLatePeroid(expectedPeriodDate: string): Promise<void> {
    const expectedDate = new Date(expectedPeriodDate);
    const today = new Date();
    const daysLate = Math.floor((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate > 3) { // Period is more than 3 days late
      await this.scheduleNotification({
        identifier: NotificationType.PERIOD_LATE,
        title: '⏰ Period Update',
        body: `Your period is ${daysLate} days late. Consider taking a pregnancy test or consulting your healthcare provider.`,
        trigger: new Date(Date.now() + 1000), // Immediate
        data: { type: NotificationType.PERIOD_LATE, daysLate }
      });
    }
  }

  // Schedule a single notification
  private async scheduleNotification(options: {
    identifier: string;
    title: string;
    body: string;
    trigger: Date;
    data?: any;
  }): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          const timeUntilTrigger = options.trigger.getTime() - Date.now();
          if (timeUntilTrigger > 0) {
            setTimeout(() => {
              new Notification(options.title, {
                body: options.body,
                icon: '/icon.png',
                tag: options.identifier,
                data: options.data
              });
            }, timeUntilTrigger);
          }
        }
      } else {
        // Native notifications - Use seconds from now for one-time notifications
        const secondsFromNow = Math.floor((options.trigger.getTime() - Date.now()) / 1000);
        
        if (secondsFromNow > 0) {
          await Notifications.scheduleNotificationAsync({
            identifier: options.identifier,
            content: {
              title: options.title,
              body: options.body,
              data: options.data,
              sound: true,
            },
            trigger: secondsFromNow,
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Schedule a repeating notification
  private async scheduleRepeatingNotification(options: {
    identifier: string;
    title: string;
    body: string;
    hour: number;
    minute: number;
    data?: any;
  }): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support repeating notifications easily
        // Schedule for next occurrence
        const nextTrigger = new Date();
        nextTrigger.setHours(options.hour, options.minute, 0, 0);
        
        if (nextTrigger <= new Date()) {
          nextTrigger.setDate(nextTrigger.getDate() + 1);
        }

        const timeUntilTrigger = nextTrigger.getTime() - Date.now();
        if (timeUntilTrigger > 0) {
          setTimeout(() => {
            new Notification(options.title, {
              body: options.body,
              icon: '/icon.png',
              tag: options.identifier,
              data: options.data
            });
          }, timeUntilTrigger);
        }
      } else {
        // Native repeating notifications - Use daily trigger
        await Notifications.scheduleNotificationAsync({
          identifier: options.identifier,
          content: {
            title: options.title,
            body: options.body,
            data: options.data,
            sound: true,
          },
          trigger: {
            hour: options.hour,
            minute: options.minute,
            repeats: true,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling repeating notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't have a direct way to cancel scheduled notifications
        // They're handled by setTimeout which we can't easily track
        console.log('Web notifications cleared (handled by browser)');
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Cancel specific notification
  async cancelNotification(identifier: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Send immediate notification
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon.png',
            data
          });
        }
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: true,
          },
          trigger: null, // Immediate
        });
      }
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Handle notification received
  static handleNotificationReceived(notification: any): void {
    const { type } = notification.request.content.data || {};
    
    switch (type) {
      case NotificationType.PERIOD_REMINDER:
        console.log('Period reminder received');
        break;
      case NotificationType.FERTILITY_REMINDER:
        console.log('Fertility reminder received');
        break;
      case NotificationType.OVULATION_REMINDER:
        console.log('Ovulation reminder received');
        break;
      case NotificationType.SYMPTOM_REMINDER:
        console.log('Symptom reminder received');
        break;
      case NotificationType.WATER_REMINDER:
        console.log('Water reminder received');
        break;
      default:
        console.log('Unknown notification type received');
    }
  }

  // Handle notification response (when user taps notification)
  static handleNotificationResponse(response: any): void {
    const { type } = response.notification.request.content.data || {};
    
    switch (type) {
      case NotificationType.PERIOD_REMINDER:
        // Navigate to log entry screen
        break;
      case NotificationType.FERTILITY_REMINDER:
        // Navigate to calendar or insights
        break;
      case NotificationType.SYMPTOM_REMINDER:
        // Navigate to log entry screen
        break;
      default:
        // Default navigation
        break;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();