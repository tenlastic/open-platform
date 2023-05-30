import { client } from '../connect';

export async function listenBucketNotification(
  bucketName: string,
  prefix: string,
  suffix: string,
  events: string[],
) {
  return client.listenBucketNotification(bucketName, prefix, suffix, events);
}
