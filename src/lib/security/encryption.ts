import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET;
  
  if (!envKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is missing.");
    }
    // Development fallback key derived via SHA-256
    return crypto.createHash("sha256").update("reportly_dev_encryption_key_32bytes!").digest();
  }

  // If key is a 64-char hex string (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  // If base64 encoded 32 bytes (44 chars)
  if (envKey.length === 44 && /^[A-Za-z0-9+/=]+$/.test(envKey)) {
    const buf = Buffer.from(envKey, "base64");
    if (buf.length === 32) return buf;
  }

  // Derive 32-byte key via SHA-256 hash of the string
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Encrypts sensitive string data (e.g. OAuth tokens) using AES-256-GCM.
 * Output format: iv:ciphertext:authTag (hex string)
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypts AES-256-GCM encrypted string.
 * Input format: iv:ciphertext:authTag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) return "";
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return "";

    const [ivHex, ciphertextHex, authTagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("AES-256-GCM Decryption failed:", err);
    return "";
  }
}
