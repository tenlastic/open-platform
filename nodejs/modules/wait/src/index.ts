/**
 * Wait for the given criteria to return true.
 * @param interval How long to wait in milliseconds between checks.
 * @param timeout How long to wait in milliseconds in total.
 */
export default async function wait(
  interval: number,
  timeout: number,
  criteria: () => any,
): Promise<any> {
  const start = Date.now();

  try {
    const result = await criteria();
    if (result) {
      return result;
    }
  } catch {}

  const duration = Date.now() - start;
  if (duration >= timeout) {
    throw new Error('Criteria did not resolve within given timeout.');
  }

  await new Promise((resolve) => setTimeout(resolve, interval));

  return wait(interval, timeout - interval - duration, criteria);
}
