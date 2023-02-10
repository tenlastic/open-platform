import { ItemBucketMetadata } from 'minio';
import { Stream } from 'stream';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function putObject(
  bucketName: string,
  objectName: string,
  stream: string | Stream | Buffer,
  metadata?: ItemBucketMetadata,
  timeout = TIMEOUT,
): Promise<string> {
  try {
    return await client.putObject(bucketName, objectName, stream, metadata);
  } catch (e) {
    if (e.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return putObject(bucketName, objectName, stream, metadata, timeout * timeout);
  }
}
