import { CopyConditions } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function copyObject(
  bucketName: string,
  objectName: string,
  sourceObject: string,
  copyConditions: CopyConditions,
  timeout = TIMEOUT,
) {
  let result: any;

  try {
    result = await client.copyObject(bucketName, objectName, sourceObject, copyConditions);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return copyObject(bucketName, objectName, sourceObject, copyConditions, timeout * timeout);
  }

  return result;
}
