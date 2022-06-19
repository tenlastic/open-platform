import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function fGetObject(
  bucketName: string,
  objectName: string,
  filePath: string,
  timeout = TIMEOUT,
) {
  let result: any;

  try {
    result = await client.fGetObject(bucketName, objectName, filePath);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return fGetObject(bucketName, objectName, filePath, timeout * timeout);
  }

  return result;
}
