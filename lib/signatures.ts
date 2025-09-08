import crypto from 'crypto';

export function verifyHmacSignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signature === digest;
}

export function createHmacSignature(rawBody: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}
