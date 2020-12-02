import { BucketItem, BucketStream } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function listObjects(
  bucketName: string,
  prefix: string,
  timeout = TIMEOUT,
): Promise<BucketItem[]> {
  let result: BucketStream<BucketItem>;

  try {
    result = client.listObjectsV2(bucketName, prefix, true);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return listObjects(bucketName, prefix, timeout * timeout);
  }

  return new Promise((resolve, reject) => {
    const objects: BucketItem[] = [];

    result.on('data', data => objects.push(data));
    result.on('end', () => resolve(objects));
    result.on('error', reject);
  });
}
