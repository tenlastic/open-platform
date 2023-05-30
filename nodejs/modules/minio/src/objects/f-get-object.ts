import { client } from '../connect';
import { execute } from '../execute';

export async function fGetObject(bucketName: string, objectName: string, filePath: string) {
  const callback = () => client.fGetObject(bucketName, objectName, filePath);
  return execute(callback);
}
