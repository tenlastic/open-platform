import { BucketItemStat } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function statObject(
  bucketName: string,
  objectName: string,
  timeout = TIMEOUT,
): Promise<BucketItemStat> {
  try {
    return await client.statObject(bucketName, objectName);
  } catch (e) {
    if (e.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return statObject(bucketName, objectName, timeout * timeout);
  }
}
