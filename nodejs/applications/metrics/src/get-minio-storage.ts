import * as minio from '@tenlastic/minio';

export async function getMinioStorage(bucketName: string): Promise<number> {
  const stream = await minio.streamObjects(bucketName);

  return new Promise((resolve, reject) => {
    let sum = 0;
    stream.on('data', (item) => (sum += item.size));
    stream.on('end', () => resolve(sum));
    stream.on('error', reject);
  });
}
