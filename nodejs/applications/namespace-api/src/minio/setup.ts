import * as minio from '@tenlastic/minio';
import { URL } from 'url';

export interface SetupOptions {
  bucket: string;
  connectionString: string;
}

export function setup(options: SetupOptions) {
  const { hostname, password, port, protocol, username } = new URL(options.connectionString);

  minio.connect({
    accessKey: username,
    endPoint: hostname,
    port: Number(port || '443'),
    secretKey: password,
    useSSL: protocol === 'https:',
  });

  return minio.makeBucket(options.bucket);
}
