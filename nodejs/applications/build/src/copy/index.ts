import * as minio from '@tenlastic/minio';
import { BuildModel, IBuild } from '@tenlastic/http';

const minioBucket = process.env.MINIO_BUCKET;

export async function copy(build: BuildModel, path: string, referenceBuild: BuildModel) {
  path = path.replace(/[\.]+\//g, '');

  const referenceFile = referenceBuild.files.find((f) => f.path === path);
  if (!referenceFile) {
    throw new Error(`Reference Build File not found: ${path}.`);
  }

  console.log(`Copying file: ${path}.`);

  const parameters = {
    compressedBytes: referenceFile.compressedBytes,
    md5: referenceFile.md5,
    path: referenceFile.path,
    uncompressedBytes: referenceFile.uncompressedBytes,
  } as IBuild.File;

  // Copy the reference Build File to the new Build.
  const fileKey = build.getFilePath(path);
  const referenceFileKey = referenceBuild.getFilePath(path);
  await minio.copyObject(minioBucket, fileKey, `${minioBucket}/${referenceFileKey}`, null);

  return parameters;
}
