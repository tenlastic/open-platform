import * as minio from '@tenlastic/minio';
import { File, FileDocument, FilePlatform } from '@tenlastic/mongoose-models';
import * as crypto from 'crypto';
import { Stream } from 'stream';
import * as unzipper from 'unzipper';

export async function unzip(buildId: string, platform: FilePlatform, stream: Stream) {
  const promises = [];

  const zip = stream.pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of zip) {
    const { path, type } = entry;

    // Skip if entry is a Directory.
    if (type === 'Directory') {
      entry.autodrain();
      continue;
    }

    const record = new File({
      buildId,
      path: path.replace(/[\.]+\//g, ''),
      platform,
    });

    const promise = saveFile(entry, record);
    promises.push(promise);
  }

  // Wait for all Files to be unzipped.
  await Promise.all(promises);
}

function getMd5FromStream(stream: Stream): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function saveFile(entry: any, record: FileDocument) {
  const minioKey = await record.getMinioKey();

  const hashPromise = getMd5FromStream(entry);
  const minioPromise = minio.putObject(process.env.MINIO_BUCKET, minioKey, entry);

  const [md5] = await Promise.all([hashPromise, minioPromise]);

  return File.findOneAndUpdate(
    { buildId: record.buildId, path: record.path, platform: record.platform },
    {
      buildId: record.buildId,
      compressedBytes: entry.vars.compressedSize,
      md5,
      path: record.path,
      platform: record.platform,
      uncompressedBytes: entry.vars.uncompressedSize,
    },
    { new: true, upsert: true },
  );
}
