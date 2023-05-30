import { client } from '../connect';
import { execute } from '../execute';
import { emptyBucket } from './empty-bucket';

export async function removeBucket(bucketName: string) {
  await emptyBucket(bucketName);

  const callback = () => client.removeBucket(bucketName);
  return execute(callback, { codes: ['BucketNotEmpty', 'SlowDown'] });
}
