import { ItemBucketMetadata } from 'minio';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function fPutObject(
  bucketName: string,
  objectName: string,
  filePath: string,
  metaData: ItemBucketMetadata,
  timeout = TIMEOUT,
): Promise<string> {
  try {
    return await client.fPutObject(bucketName, objectName, filePath, metaData);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return fPutObject(bucketName, objectName, filePath, metaData, timeout * timeout);
  }
}
