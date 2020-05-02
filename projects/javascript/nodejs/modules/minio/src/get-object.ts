import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function getObject(bucketName: string, objectName: string, timeout = TIMEOUT) {
  let result: any;

  try {
    result = await client.getObject(bucketName, objectName);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return getObject(bucketName, objectName, timeout * timeout);
  }

  return result;
}
