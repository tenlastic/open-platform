import { client } from '../connect';
import { execute } from '../execute';

export async function getObject(bucketName: string, objectName: string) {
  const callback = () => client.getObject(bucketName, objectName);
  return execute(callback);
}
