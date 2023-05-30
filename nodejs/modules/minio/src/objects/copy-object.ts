import { BucketItemCopy, CopyConditions } from 'minio';

import { client } from '../connect';
import { execute } from '../execute';

export async function copyObject(
  bucketName: string,
  objectName: string,
  sourceObject: string,
  copyConditions: CopyConditions,
) {
  const callback = () => client.copyObject(bucketName, objectName, sourceObject, copyConditions);
  return execute(callback);
}
