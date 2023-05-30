import { client } from '../connect';

export function streamObjects(bucketName: string, prefix?: string) {
  return client.listObjectsV2(bucketName, prefix, true);
}
