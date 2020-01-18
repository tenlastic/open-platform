import * as Minio from 'minio';

export let client: Minio.Client;

export function connect(options: Minio.ClientOptions) {
  client = new Minio.Client(options);
}

export function getClient() {
  return client;
}
