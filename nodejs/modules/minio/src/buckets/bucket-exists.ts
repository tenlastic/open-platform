import { client } from '../connect';
import { execute } from '../execute';

export async function bucketExists(bucketName: string) {
  const callback = () => client.bucketExists(bucketName);
  return execute(callback);
}
