import { performance } from 'perf_hooks';

/**
 * Wait for the given criteria to return true.
 * @param interval How long to wait in milliseconds between checks.
 * @param timeout How long to wait in milliseconds in total.
 */
export async function wait(interval: number, timeout: number, criteria: () => any) {
  const start = performance.now();

  const result = await criteria();
  if (result) {
    return result;
  }

  const duration = performance.now() - start;
  if (duration >= timeout) {
    throw new Error('Criteria did not resolve within given timeout.');
  }

  await new Promise(resolve => setTimeout(resolve, interval));

  return wait(interval, timeout - duration, criteria);
}
