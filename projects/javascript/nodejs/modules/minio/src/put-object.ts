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
  let result: any;

  try {
    result = await client.putObject(bucketName, objectName, stream, metadata);
  } catch (e) {
    if (timeout > TIMEOUT_LIMIT || !e.code || e.code !== 'SlowDown') {
      throw e;
    }

    await new Promise(res => setTimeout(res, timeout));
    return putObject(bucketName, objectName, stream, metadata, timeout * timeout);
  }

  return result;
}
