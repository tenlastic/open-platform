import { connect, makeBucket } from '@tenlastic/minio';
import { URL } from 'url';

export async function minio(bucket: string, connectionString: string) {
  const url = new URL(connectionString);
  connect({
    accessKey: url.username,
    endPoint: url.hostname,
    port: Number(url.port || '443'),
    secretKey: url.password,
    useSSL: url.protocol === 'https:',
  });

  console.log('Creating bucket...');
  await makeBucket(bucket);
  console.log('Created bucket successfully!');
}
