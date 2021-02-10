import * as minio from '@tenlastic/minio';
import { File } from '@tenlastic/mongoose-models';

export async function copy(
  buildId: string,
  path: string,
  platform: string,
  previousBuildId: string,
) {
  path = path.replace(/[\.]+\//g, '');

  const previousFile = await File.findOne({ buildId: previousBuildId, path, platform });
  if (!previousFile) {
    throw new Error('Previous File not found.');
  }

  const parameters = {
    buildId,
    compressedBytes: previousFile.compressedBytes,
    md5: previousFile.md5,
    namespaceId: previousFile.namespaceId,
    path: previousFile.path,
    platform: previousFile.platform,
    uncompressedBytes: previousFile.uncompressedBytes,
  };
  const currentFile = new File(parameters);

  // Copy the previous file to the new build.
  const bucket = process.env.MINIO_BUCKET;
  const currentFileKey = await currentFile.getMinioKey();
  const previousFileKey = await previousFile.getMinioKey();
  await minio.copyObject(bucket, currentFileKey, `${bucket}/${previousFileKey}`, null);

  return File.findOneAndUpdate(
    { buildId, path: previousFile.path, platform: previousFile.platform },
    parameters,
    { new: true, upsert: true },
  );
}
