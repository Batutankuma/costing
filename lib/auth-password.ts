import bcrypt from "bcryptjs";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/** Aligné sur Better Auth (scrypt par défaut) pour les comptes créés via inscription publique */
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 16,
  p: 1,
  maxmem: 128 * 16384 * 16 * 2,
} as const;

const BCRYPT_ROUNDS = 10;

export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

export function isLegacyScryptHash(hash: string): boolean {
  return /^[0-9a-f]+:[0-9a-f]+$/i.test(hash);
}

/** Hash bcrypt — utilisé pour toute nouvelle création / réinitialisation admin */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Vérifie bcrypt ou ancien hash scrypt (inscription Better Auth avant migration) */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }
  if (isLegacyScryptHash(hash)) {
    return verifyLegacyScryptPassword(hash, password);
  }
  return false;
}

async function verifyLegacyScryptPassword(stored: string, password: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const storedKey = Buffer.from(keyHex, "hex");
    const derivedKey = (await scryptAsync(password, salt, 64, SCRYPT_OPTIONS)) as Buffer;

    if (storedKey.length !== derivedKey.length) return false;
    return timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}

/** Génère un mot de passe temporaire lisible */
export function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-10) + "!A1";
}
