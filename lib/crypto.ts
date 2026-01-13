import crypto from "crypto";

const ALGO = "aes-256-gcm";
// AES-256 requires a 32-byte key (64 hex characters)
const REQUIRED_KEY_LENGTH = 32;

function getKey(): Buffer {
  const masterKey = process.env.MASTER_KEY;
  
  if (!masterKey) {
    throw new Error(
      "MASTER_KEY environment variable is not set. Please set it in your .env file."
    );
  }

  // Try to parse as hex first
  let key: Buffer;
  try {
    key = Buffer.from(masterKey, "hex");
  } catch {
    // If not valid hex, use the string directly and hash it
    key = crypto.createHash("sha256").update(masterKey).digest();
  }

  // Ensure key is exactly 32 bytes
  if (key.length !== REQUIRED_KEY_LENGTH) {
    // If key is too short, hash it to get 32 bytes
    if (key.length < REQUIRED_KEY_LENGTH) {
      key = crypto.createHash("sha256").update(masterKey).digest();
    } else {
      // If key is too long, truncate it
      key = key.slice(0, REQUIRED_KEY_LENGTH);
    }
  }

  return key;
}

const KEY = getKey();

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:encrypted:authTag (all in hex)
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export function decrypt(payload: string): string {
  try {
    const parts = payload.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted payload format");
    }
    
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}