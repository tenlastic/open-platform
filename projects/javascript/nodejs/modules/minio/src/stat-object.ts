import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function statObject(bucketName: string, objectName: string, timeout = TIMEOUT) {
  let result: any;

  try {
    result = await client.statObject(bucketName, objectName);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return statObject(bucketName, objectName, timeout * timeout);
  }

  return result;
}
