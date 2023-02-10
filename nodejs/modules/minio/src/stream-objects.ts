import { BucketItem, BucketStream } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function streamObjects(
  bucketName: string,
  prefix?: string,
  timeout = TIMEOUT,
): Promise<BucketStream<BucketItem>> {
  try {
    return client.listObjectsV2(bucketName, prefix, true);
  } catch (e) {
    if (e.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return streamObjects(bucketName, prefix, timeout * timeout);
  }
}
