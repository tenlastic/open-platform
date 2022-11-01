import { BucketItemCopy, CopyConditions } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function copyObject(
  bucketName: string,
  objectName: string,
  sourceObject: string,
  copyConditions: CopyConditions,
  timeout = TIMEOUT,
): Promise<BucketItemCopy> {
  try {
    return await client.copyObject(bucketName, objectName, sourceObject, copyConditions);
  } catch (e) {
    if (e?.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return copyObject(bucketName, objectName, sourceObject, copyConditions, timeout * timeout);
  }
}
