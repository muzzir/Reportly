import { encrypt, decrypt } from "./encryption";

export { encrypt, decrypt };

/**
 * Backward compatibility alias for token encryption.
 */
export function encryptToken(text: string): string {
  return encrypt(text);
}

/**
 * Backward compatibility alias for token decryption.
 */
export function decryptToken(encryptedData: string): string {
  return decrypt(encryptedData);
}
