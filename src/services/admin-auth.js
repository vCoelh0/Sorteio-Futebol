import { timingSafeEqual } from 'node:crypto';

export function secureCompare(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}
