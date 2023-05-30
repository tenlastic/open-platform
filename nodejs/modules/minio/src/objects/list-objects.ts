import { BucketItem } from 'minio';

import { client } from '../connect';

export function listObjects(bucketName: string, prefix: string) {
  const stream = client.listObjectsV2(bucketName, prefix, true);

  return new Promise<BucketItem[]>((resolve, reject) => {
    const objects: BucketItem[] = [];

    stream.on('data', (data) => objects.push(data));
    stream.on('end', () => resolve(objects));
    stream.on('error', reject);
  });
}
