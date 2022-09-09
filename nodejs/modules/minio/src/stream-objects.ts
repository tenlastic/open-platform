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
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return streamObjects(bucketName, prefix, timeout * timeout);
  }
}
