import crypto from 'crypto';

/**
 * Interface for the encrypted data structure stored in MySQL
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Retrieves the encryption key from environment variables and validates it
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.CCCD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CCCD_ENCRYPTION_KEY is not defined in environment variables');
  }
  // Assume hex string of 64 characters (32 bytes)
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('CCCD_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }
  return keyBuffer;
};

/**
 * Retrieves the blind index hashing key from environment variables and validates it
 */
const getIndexKey = (): Buffer => {
  const key = process.env.CCCD_INDEX_KEY;
  if (!key) {
    throw new Error('CCCD_INDEX_KEY is not defined in environment variables');
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypts CCCD using AES-256-GCM
 * @param plainText The plaintext CCCD string
 * @returns Object containing hex-encoded ciphertext, iv, and auth tag
 */
export const encryptCCCD = (plainText: string): EncryptedData => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // Recommended IV size for GCM is 12 bytes
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag,
    };
  } catch (error) {
    // DO NOT log the sensitive input data
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypts CCCD using AES-256-GCM
 * @param data Object containing hex-encoded ciphertext, iv, and auth tag
 * @returns The original plaintext CCCD string
 */
export const decryptCCCD = (data: EncryptedData): string => {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(data.iv, 'hex');
    const tag = Buffer.from(data.tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(data.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // DO NOT log the sensitive input data
    throw new Error('Decryption failed');
  }
};

/**
 * Hashes CCCD for blind indexing using HMAC-SHA256
 * @param plainText The plaintext CCCD string
 * @returns Hex-encoded hash for database matching
 */
export const hashCCCDForBlindIndex = (plainText: string): string => {
  try {
    const key = getIndexKey();
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(plainText);
    return hmac.digest('hex');
  } catch (error) {
    // DO NOT log the sensitive input data
    throw new Error('Hashing failed');
  }
};
