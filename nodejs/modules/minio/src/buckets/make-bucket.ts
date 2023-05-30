import { client } from '../connect';
import { execute } from '../execute';
import { bucketExists } from './bucket-exists';

export async function makeBucket(bucketName: string) {
  const result = await bucketExists(bucketName);
  if (result) {
    return;
  }

  const callback = () => client.makeBucket(bucketName, 'us-east-1');
  return execute(callback);
}
