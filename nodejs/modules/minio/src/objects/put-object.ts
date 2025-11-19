import { ItemBucketMetadata } from 'minio';
import { Stream } from 'stream';

import { client } from '../connect';
import { execute } from '../execute';

export async function putObject(
  bucketName: string,
  objectName: string,
  stream: Buffer | Stream | string,
  metadata?: ItemBucketMetadata,
) {
  const callback = () => client.putObject(bucketName, objectName, stream, metadata);
  return execute(callback);
}
