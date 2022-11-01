import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function fGetObject(
  bucketName: string,
  objectName: string,
  filePath: string,
  timeout = TIMEOUT,
): Promise<void> {
  try {
    return await client.fGetObject(bucketName, objectName, filePath);
  } catch (e) {
    if (e?.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return fGetObject(bucketName, objectName, filePath, timeout * timeout);
  }
}
