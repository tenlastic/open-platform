import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function removeBucket(bucketName: string, timeout = TIMEOUT): Promise<void> {
  try {
    return await client.removeBucket(bucketName);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return removeBucket(bucketName, timeout * timeout);
  }
}
