import * as minio from '@tenlastic/minio';
import { Context } from '@tenlastic/web-server';

import { Stream } from 'stream';
import { MinioStorefront } from '../../../../minio';

export type DownloadStorefrontContext = Context<
  { _id?: string; field?: string; namespaceId?: string; storefrontId?: string },
  void,
  Stream
>;

export async function handler(ctx: DownloadStorefrontContext) {
  const { _id, field, namespaceId, storefrontId } = ctx.params;

  const bucket = process.env.MINIO_BUCKET;
  const objectName = MinioStorefront.getObjectName(namespaceId, storefrontId, field, _id);

  const info = await minio.statObject(bucket, objectName);
  const stream = await minio.getObject(bucket, objectName);

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
