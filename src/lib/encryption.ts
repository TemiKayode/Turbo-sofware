import CryptoJS from 'crypto-js'

// In production, this should be stored securely and retrieved from environment variables
// For now, using a placeholder - MUST be changed in production
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production-32chars!!'

/**
 * Encrypts sensitive data using AES encryption
 */
export function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data')
    }
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypts an object containing sensitive personnel information
 */
export function encryptPersonnelData(data: Record<string, any>): string {
  const jsonString = JSON.stringify(data)
  return encryptData(jsonString)
}

/**
 * Decrypts personnel data back to an object
 */
export function decryptPersonnelData(encryptedData: string): Record<string, any> {
  const decrypted = decryptData(encryptedData)
  return JSON.parse(decrypted)
}


