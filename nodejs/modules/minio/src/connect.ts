import * as minio from 'minio';

export let client: minio.Client;

export function connect(options: minio.ClientOptions) {
  options.accessKey = decodeURIComponent(options.accessKey);
  options.endPoint = decodeURIComponent(options.endPoint);
  options.secretKey = decodeURIComponent(options.secretKey);

  client = new minio.Client(options);
}
