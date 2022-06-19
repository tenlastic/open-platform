import * as Minio from 'minio';

export let client: Minio.Client;

export function connect(options: Minio.ClientOptions) {
  options.accessKey = decodeURIComponent(options.accessKey);
  options.endPoint = decodeURIComponent(options.endPoint);
  options.secretKey = decodeURIComponent(options.secretKey);

  client = new Minio.Client(options);
}

export function getClient() {
  return client;
}
