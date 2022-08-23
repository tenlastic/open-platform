import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function makeBucket(bucketName: string, timeout = TIMEOUT): Promise<void> {
  try {
    const bucketExists = await client.bucketExists(bucketName);
    if (bucketExists) {
      return;
    }

    return await client.makeBucket(bucketName, 'us-east-1');
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return makeBucket(bucketName, timeout * timeout);
  }
}
