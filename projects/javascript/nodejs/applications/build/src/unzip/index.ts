import * as minio from '@tenlastic/minio';
import { BuildDocument, BuildFile, BuildFileDocument } from '@tenlastic/mongoose-models';
import * as crypto from 'crypto';
import { Stream } from 'stream';
import * as unzipper from 'unzipper';

const minioBucket = process.env.MINIO_BUCKET;

export async function unzip(build: BuildDocument, stream: Stream) {
  const promises = [];

  const zip = stream.pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of zip) {
    const { path, type } = entry;

    // Skip if entry is a Directory.
    if (type === 'Directory') {
      entry.autodrain();
      continue;
    }

    console.log(`Unzipping file: ${path}.`);

    const promise = saveFile(build, entry, path);
    promises.push(promise);
  }

  // Wait for all Files to be unzipped.
  return Promise.all<BuildFileDocument>(promises);
}

function getMd5FromStream(stream: Stream): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function saveFile(build: BuildDocument, entry: any, path: string) {
  const hashPromise = getMd5FromStream(entry);
  const minioPromise = minio.putObject(minioBucket, build.getFilePath(path), entry);

  const [md5] = await Promise.all([hashPromise, minioPromise]);

  return new BuildFile({
    compressedBytes: entry.vars.compressedSize,
    md5,
    path,
    uncompressedBytes: entry.vars.uncompressedSize,
  });
}
