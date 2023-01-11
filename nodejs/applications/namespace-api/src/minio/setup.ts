import * as minio from '@tenlastic/minio';
import { URL } from 'url';

export interface SetupOptions {
  connectionString: string;
}

export function setup(options: SetupOptions) {
  const url = new URL(options.connectionString);
  minio.connect({
    accessKey: url.username,
    endPoint: url.hostname,
    port: Number(url.port || '443'),
    secretKey: url.password,
    useSSL: url.protocol === 'https:',
  });
}
