import { client } from '../connect';
import { execute } from '../execute';

export async function removeObjects(bucketName: string, objectsList: string[]) {
  const callback = () => client.removeObjects(bucketName, objectsList);
  return execute(callback);
}
