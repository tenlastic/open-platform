import { client } from '../connect';
import { execute } from '../execute';

export async function statObject(bucketName: string, objectName: string) {
  const callback = () => client.statObject(bucketName, objectName);
  return execute(callback);
}
