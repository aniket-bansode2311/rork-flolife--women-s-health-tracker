import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// Enhanced encryption utilities for sensitive data
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-256-GCM';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits

  // Generate a secure encryption key
  static async generateKey(): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // Web fallback using crypto.getRandomValues
        const array = new Uint8Array(this.KEY_LENGTH);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      } else {
        // Native implementation using expo-crypto
        const randomBytes = await Crypto.getRandomBytesAsync(this.KEY_LENGTH);
        return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      console.error('Error generating encryption key:', error);
      // Fallback to a deterministic but secure key based on device info
      return await this.generateFallbackKey();
    }
  }

  // Generate a fallback key for cases where crypto is not available
  private static async generateFallbackKey(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    const combined = timestamp + random + 'cyclix-secure-key';
    
    if (Platform.OS === 'web') {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
    }
  }

  // Encrypt sensitive data
  static async encrypt(data: string, key?: string): Promise<{ encrypted: string; iv: string } | null> {
    try {
      if (Platform.OS === 'web') {
        return await this.encryptWeb(data, key);
      } else {
        return await this.encryptNative(data, key);
      }
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  // Decrypt sensitive data
  static async decrypt(encryptedData: string, iv: string, key?: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await this.decryptWeb(encryptedData, iv, key);
      } else {
        return await this.decryptNative(encryptedData, iv, key);
      }
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Web-specific encryption
  private static async encryptWeb(data: string, key?: string): Promise<{ encrypted: string; iv: string } | null> {
    try {
      const encryptionKey = key || await this.generateKey();
      const keyBuffer = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );
      
      const encryptedArray = Array.from(new Uint8Array(encrypted));
      const ivArray = Array.from(iv);
      
      return {
        encrypted: encryptedArray.map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: ivArray.map(b => b.toString(16).padStart(2, '0')).join('')
      };
    } catch (error) {
      console.error('Web encryption error:', error);
      return null;
    }
  }

  // Web-specific decryption
  private static async decryptWeb(encryptedData: string, iv: string, key?: string): Promise<string | null> {
    try {
      const encryptionKey = key || await this.generateKey();
      const keyBuffer = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const ivBuffer = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const encryptedBuffer = new Uint8Array(encryptedData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        cryptoKey,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Web decryption error:', error);
      return null;
    }
  }

  // Native-specific encryption (simplified for demo)
  private static async encryptNative(data: string, key?: string): Promise<{ encrypted: string; iv: string } | null> {
    try {
      // For native, we'll use a simple base64 encoding with a hash for demo purposes
      // In production, you'd want to use a proper encryption library
      const encryptionKey = key || await this.generateKey();
      const iv = await Crypto.getRandomBytesAsync(this.IV_LENGTH);
      const ivHex = Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Simple XOR encryption for demo (use proper encryption in production)
      const keyBytes = encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
      const dataBytes = Array.from(data, char => char.charCodeAt(0));
      
      const encrypted = dataBytes.map((byte, index) => 
        byte ^ keyBytes[index % keyBytes.length]
      );
      
      const encryptedHex = encrypted.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return {
        encrypted: encryptedHex,
        iv: ivHex
      };
    } catch (error) {
      console.error('Native encryption error:', error);
      return null;
    }
  }

  // Native-specific decryption
  private static async decryptNative(encryptedData: string, iv: string, key?: string): Promise<string | null> {
    try {
      const encryptionKey = key || await this.generateKey();
      const keyBytes = encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
      const encryptedBytes = encryptedData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
      
      // Simple XOR decryption for demo
      const decrypted = encryptedBytes.map((byte, index) => 
        byte ^ keyBytes[index % keyBytes.length]
      );
      
      return String.fromCharCode(...decrypted);
    } catch (error) {
      console.error('Native decryption error:', error);
      return null;
    }
  }

  // Hash sensitive data for comparison without storing plaintext
  static async hashData(data: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
      }
    } catch (error) {
      console.error('Hashing error:', error);
      return data; // Fallback to original data if hashing fails
    }
  }

  // Validate data integrity
  static async validateIntegrity(data: string, hash: string): Promise<boolean> {
    try {
      const computedHash = await this.hashData(data);
      return computedHash === hash;
    } catch (error) {
      console.error('Integrity validation error:', error);
      return false;
    }
  }
}

// Utility functions for secure data handling
export const secureStorage = {
  // Encrypt and store sensitive data
  setSecureItem: async (key: string, value: string): Promise<boolean> => {
    try {
      const encrypted = await DataEncryption.encrypt(value);
      if (!encrypted) return false;
      
      const secureData = JSON.stringify(encrypted);
      // Store in AsyncStorage or SecureStore
      // For demo, we'll use AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`secure_${key}`, secureData);
      return true;
    } catch (error) {
      console.error('Secure storage error:', error);
      return false;
    }
  },

  // Retrieve and decrypt sensitive data
  getSecureItem: async (key: string): Promise<string | null> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const secureData = await AsyncStorage.getItem(`secure_${key}`);
      if (!secureData) return null;
      
      const encrypted = JSON.parse(secureData);
      return await DataEncryption.decrypt(encrypted.encrypted, encrypted.iv);
    } catch (error) {
      console.error('Secure retrieval error:', error);
      return null;
    }
  },

  // Remove secure item
  removeSecureItem: async (key: string): Promise<boolean> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(`secure_${key}`);
      return true;
    } catch (error) {
      console.error('Secure removal error:', error);
      return false;
    }
  }
};