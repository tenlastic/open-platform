import { performance } from 'perf_hooks';

/**
 * Wait for the given criteria to return true.
 * @param timeout How long to wait in milliseconds.
 */
export async function wait(interval: number, timeout: number, criteria: () => Promise<boolean>) {
  const start = performance.now();

  const result = await criteria();
  if (result) {
    return;
  }

  const duration = performance.now() - start;
  if (duration >= timeout) {
    throw new Error('Criteria did not resolve within given timeout.');
  }

  setTimeout(() => wait(interval, timeout - duration, criteria), interval);
}
