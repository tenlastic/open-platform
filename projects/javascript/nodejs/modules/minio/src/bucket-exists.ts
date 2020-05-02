import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function bucketExists(bucketName: string, timeout = TIMEOUT) {
  let result: any;

  try {
    result = await client.bucketExists(bucketName);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return bucketExists(bucketName, timeout * timeout);
  }

  return result;
}
