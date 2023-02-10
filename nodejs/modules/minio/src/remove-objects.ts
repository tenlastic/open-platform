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
    if (e.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return removeObjects(bucketName, objectsList, timeout * timeout);
  }
}
