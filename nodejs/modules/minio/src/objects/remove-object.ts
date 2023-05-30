import { client } from '../connect';
import { execute } from '../execute';

export async function removeObject(bucketName: string, objectName: string) {
  const callback = () => client.removeObject(bucketName, objectName);
  return execute(callback);
}
