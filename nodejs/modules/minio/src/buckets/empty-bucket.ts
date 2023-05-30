import { removeObject, streamObjects } from '../objects';

export async function emptyBucket(bucketName: string) {
  const promises = [];
  const stream = streamObjects(bucketName, null);

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (data) => {
      const promise = removeObject(bucketName, data.name);
      promises.push(promise);
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return Promise.all(promises);
}
