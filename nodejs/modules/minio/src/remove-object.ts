import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function removeObject(
  bucketName: string,
  objectName: string,
  timeout = TIMEOUT,
): Promise<void> {
  try {
    return await client.removeObject(bucketName, objectName);
  } catch (e) {
    if (e.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return removeObject(bucketName, objectName, timeout * timeout);
  }
}
