import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function removeObjects(
  bucketName: string,
  objectsList: string[],
  timeout = TIMEOUT,
): Promise<void> {
  try {
    return await client.removeObjects(bucketName, objectsList);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return removeObjects(bucketName, objectsList, timeout * timeout);
  }
}
