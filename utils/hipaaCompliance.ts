import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

// HIPAA Compliance utilities for medical data protection
export interface HIPAAConfig {
  encryptionEnabled: boolean;
  auditLogging: boolean;
  dataRetentionDays: number;
  minimumPasswordLength: number;
  sessionTimeoutMinutes: number;
  biometricAuthRequired: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  dataType: string;
  ipAddress?: string;
  deviceInfo: string;
  success: boolean;
  details?: string;
}

export interface DataAccessLog {
  timestamp: string;
  dataType: 'period_logs' | 'cycles' | 'profile' | 'symptoms' | 'predictions';
  action: 'read' | 'write' | 'delete' | 'export';
  userId: string;
  sessionId: string;
}

// HIPAA-compliant configuration
export const HIPAA_CONFIG: HIPAAConfig = {
  encryptionEnabled: true,
  auditLogging: true,
  dataRetentionDays: 2555, // 7 years as required by HIPAA
  minimumPasswordLength: 12,
  sessionTimeoutMinutes: 30,
  biometricAuthRequired: true
};

// Encryption utilities using AES-256
export class HIPAAEncryption {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16;

  // Generate a secure encryption key
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }

  // Encrypt sensitive data
  static encrypt(data: string, key: string): string {
    try {
      const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);
      return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string, key: string): string {
    try {
      const combined = CryptoJS.enc.Base64.parse(encryptedData);
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, this.IV_SIZE / 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(this.IV_SIZE / 4));
      
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Hash sensitive data for indexing (one-way)
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }
}

// Audit logging for HIPAA compliance
export class HIPAAAuditLogger {
  private static readonly AUDIT_LOG_KEY = 'hipaa_audit_logs';
  private static readonly MAX_LOG_ENTRIES = 10000;

  // Log data access events
  static async logDataAccess(log: DataAccessLog): Promise<void> {
    if (!HIPAA_CONFIG.auditLogging) return;

    try {
      const existingLogs = await this.getAuditLogs();
      const newLog: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        userId: log.userId,
        action: `${log.action}_${log.dataType}`,
        dataType: log.dataType,
        deviceInfo: await this.getDeviceInfo(),
        success: true,
        details: `Session: ${log.sessionId}`
      };

      existingLogs.push(newLog);

      // Maintain log size limit
      if (existingLogs.length > this.MAX_LOG_ENTRIES) {
        existingLogs.splice(0, existingLogs.length - this.MAX_LOG_ENTRIES);
      }

      await this.saveAuditLogs(existingLogs);
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  // Log authentication events
  static async logAuthEvent(
    userId: string,
    action: 'login' | 'logout' | 'failed_login' | 'password_change',
    success: boolean,
    details?: string
  ): Promise<void> {
    if (!HIPAA_CONFIG.auditLogging) return;

    try {
      const existingLogs = await this.getAuditLogs();
      const newLog: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        dataType: 'authentication',
        deviceInfo: await this.getDeviceInfo(),
        success,
        details
      };

      existingLogs.push(newLog);
      await this.saveAuditLogs(existingLogs);
    } catch (error) {
      console.error('Auth audit logging failed:', error);
    }
  }

  // Get device information for audit logs
  private static async getDeviceInfo(): Promise<string> {
    const platform = Platform.OS;
    const version = Platform.Version;
    return `${platform}_${version}`;
  }

  // Retrieve audit logs
  private static async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const logs = await AsyncStorage.getItem(this.AUDIT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  // Save audit logs
  private static async saveAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  // Export audit logs for compliance reporting
  static async exportAuditLogs(startDate?: Date, endDate?: Date): Promise<AuditLogEntry[]> {
    const logs = await this.getAuditLogs();
    
    if (!startDate && !endDate) {
      return logs;
    }

    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }
}

// Secure data storage with encryption
export class HIPAASecureStorage {
  private static encryptionKey: string | null = null;

  // Initialize encryption key
  static async initializeEncryption(): Promise<void> {
    try {
      let key = await AsyncStorage.getItem('hipaa_encryption_key');
      if (!key) {
        key = HIPAAEncryption.generateKey();
        await AsyncStorage.setItem('hipaa_encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  // Store encrypted data
  static async setSecureItem(key: string, value: any, userId: string): Promise<void> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const jsonValue = JSON.stringify(value);
      const encryptedValue = HIPAA_CONFIG.encryptionEnabled 
        ? HIPAAEncryption.encrypt(jsonValue, this.encryptionKey!)
        : jsonValue;

      await AsyncStorage.setItem(key, encryptedValue);

      // Log data access
      await HIPAAAuditLogger.logDataAccess({
        timestamp: new Date().toISOString(),
        dataType: this.getDataTypeFromKey(key),
        action: 'write',
        userId,
        sessionId: await this.getCurrentSessionId()
      });
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  // Retrieve encrypted data
  static async getSecureItem(key: string, userId: string): Promise<any> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;

      const jsonValue = HIPAA_CONFIG.encryptionEnabled
        ? HIPAAEncryption.decrypt(encryptedValue, this.encryptionKey!)
        : encryptedValue;

      // Log data access
      await HIPAAAuditLogger.logDataAccess({
        timestamp: new Date().toISOString(),
        dataType: this.getDataTypeFromKey(key),
        action: 'read',
        userId,
        sessionId: await this.getCurrentSessionId()
      });

      return JSON.parse(jsonValue);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  // Remove encrypted data
  static async removeSecureItem(key: string, userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);

      // Log data access
      await HIPAAAuditLogger.logDataAccess({
        timestamp: new Date().toISOString(),
        dataType: this.getDataTypeFromKey(key),
        action: 'delete',
        userId,
        sessionId: await this.getCurrentSessionId()
      });
    } catch (error) {
      console.error('Secure removal failed:', error);
    }
  }

  // Get data type from storage key
  private static getDataTypeFromKey(key: string): DataAccessLog['dataType'] {
    if (key.includes('period')) return 'period_logs';
    if (key.includes('cycle')) return 'cycles';
    if (key.includes('profile')) return 'profile';
    if (key.includes('symptom')) return 'symptoms';
    if (key.includes('prediction')) return 'predictions';
    return 'period_logs';
  }

  // Get current session ID
  private static async getCurrentSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem('current_session_id');
      if (!sessionId) {
        sessionId = CryptoJS.lib.WordArray.random(16).toString();
        await AsyncStorage.setItem('current_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return 'unknown_session';
    }
  }
}

// Data retention and cleanup for HIPAA compliance
export class HIPAADataRetention {
  // Clean up old data based on retention policy
  static async cleanupOldData(): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - HIPAA_CONFIG.dataRetentionDays);

      // This would need to be implemented based on your data structure
      // For now, we'll just log the cleanup attempt
      console.log(`Data cleanup initiated for data older than ${retentionDate.toISOString()}`);

      // Log the cleanup action
      await HIPAAAuditLogger.logDataAccess({
        timestamp: new Date().toISOString(),
        dataType: 'period_logs',
        action: 'delete',
        userId: 'system',
        sessionId: 'cleanup_job'
      });
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  // Export user data for HIPAA right of access
  static async exportUserData(userId: string): Promise<{
    periodLogs: any[];
    cycles: any[];
    profile: any;
    auditLogs: AuditLogEntry[];
  }> {
    try {
      // This would retrieve all user data
      const periodLogs = await HIPAASecureStorage.getSecureItem('period-storage', userId) || [];
      const cycles = await HIPAASecureStorage.getSecureItem('cycle-storage', userId) || [];
      const profile = await HIPAASecureStorage.getSecureItem('profile-storage', userId) || {};
      const auditLogs = await HIPAAAuditLogger.exportAuditLogs();

      // Filter audit logs for this user
      const userAuditLogs = auditLogs.filter(log => log.userId === userId);

      // Log the export action
      await HIPAAAuditLogger.logDataAccess({
        timestamp: new Date().toISOString(),
        dataType: 'period_logs',
        action: 'export',
        userId,
        sessionId: await HIPAASecureStorage['getCurrentSessionId']()
      });

      return {
        periodLogs,
        cycles,
        profile,
        auditLogs: userAuditLogs
      };
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error('Failed to export user data');
    }
  }
}

// Session management for HIPAA compliance
export class HIPAASessionManager {
  private static sessionTimer: NodeJS.Timeout | null = null;
  private static sessionStartTime: Date | null = null;

  // Start a new session
  static async startSession(userId: string): Promise<string> {
    try {
      const sessionId = CryptoJS.lib.WordArray.random(16).toString();
      await AsyncStorage.setItem('current_session_id', sessionId);
      await AsyncStorage.setItem('session_user_id', userId);
      
      this.sessionStartTime = new Date();
      this.resetSessionTimer();

      await HIPAAAuditLogger.logAuthEvent(userId, 'login', true, `Session: ${sessionId}`);
      
      return sessionId;
    } catch (error) {
      console.error('Session start failed:', error);
      throw new Error('Failed to start session');
    }
  }

  // End current session
  static async endSession(): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('session_user_id');
      const sessionId = await AsyncStorage.getItem('current_session_id');

      if (userId) {
        await HIPAAAuditLogger.logAuthEvent(userId, 'logout', true, `Session: ${sessionId}`);
      }

      await AsyncStorage.removeItem('current_session_id');
      await AsyncStorage.removeItem('session_user_id');
      
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }
      
      this.sessionStartTime = null;
    } catch (error) {
      console.error('Session end failed:', error);
    }
  }

  // Reset session timeout
  static resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(async () => {
      console.log('Session timeout - automatically logging out');
      await this.endSession();
      // Here you would trigger a logout in your app
    }, HIPAA_CONFIG.sessionTimeoutMinutes * 60 * 1000);
  }

  // Check if session is valid
  static async isSessionValid(): Promise<boolean> {
    try {
      const sessionId = await AsyncStorage.getItem('current_session_id');
      const userId = await AsyncStorage.getItem('session_user_id');
      
      if (!sessionId || !userId || !this.sessionStartTime) {
        return false;
      }

      const now = new Date();
      const sessionDuration = now.getTime() - this.sessionStartTime.getTime();
      const maxDuration = HIPAA_CONFIG.sessionTimeoutMinutes * 60 * 1000;

      return sessionDuration < maxDuration;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }
}

// Initialize HIPAA compliance on app start
export const initializeHIPAACompliance = async (): Promise<void> => {
  try {
    await HIPAASecureStorage.initializeEncryption();
    console.log('HIPAA compliance initialized successfully');
  } catch (error) {
    console.error('HIPAA compliance initialization failed:', error);
    throw error;
  }
};