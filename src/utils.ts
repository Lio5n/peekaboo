import * as crypto from 'crypto';

export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}
