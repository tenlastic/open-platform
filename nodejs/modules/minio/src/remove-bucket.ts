import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';
import { removeObject } from './remove-object';
import { streamObjects } from './stream-objects';

export async function removeBucket(bucketName: string, timeout = TIMEOUT): Promise<void> {
  const stream = await streamObjects(bucketName);

  await new Promise((resolve, reject) => {
    const promises = [];
    stream.on('data', async (data) => await removeObject(bucketName, data.name));
    stream.on('end', () => Promise.all(promises).then(resolve).catch(reject));
    stream.on('error', reject);
  });

  try {
    return await client.removeBucket(bucketName);
  } catch (e) {
    if (e?.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return removeBucket(bucketName, timeout * timeout);
  }
}
