import { ItemBucketMetadata } from 'minio';

import { client } from '../connect';
import { execute } from '../execute';

export async function fPutObject(
  bucketName: string,
  objectName: string,
  filePath: string,
  metaData: ItemBucketMetadata,
) {
  const callback = () => client.fPutObject(bucketName, objectName, filePath, metaData);
  return execute(callback);
}
