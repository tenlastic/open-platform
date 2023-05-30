import * as minio from '@tenlastic/minio';

export async function getMinioStorage(bucketName: string): Promise<number> {
  const stream = minio.streamObjects(bucketName);

  let sum = 0;
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (item) => (sum += item.size));
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return sum;
}
