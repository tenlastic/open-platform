import { BuildModel } from '@tenlastic/http';
import * as minio from '@tenlastic/minio';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import { unzip } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('unzip', function () {
  let build: BuildModel;

  beforeEach(async function () {
    build = new BuildModel({ namespaceId: chance.hash() });

    // Upload zip to Minio.
    const zip = new JSZip();
    zip.file('index.spec.ts', fs.createReadStream(__filename));

    const stream = zip.generateNodeStream({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
    });
    await minio.putObject(process.env.MINIO_BUCKET, build.getZipPath(), stream);

    // Calculate MD5 for zipped file.
    await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(__filename);
      const hash = crypto.createHash('md5');
      fileStream.on('error', (err) => reject(err));
      fileStream.on('data', (chunk) => hash.update(chunk));
      fileStream.on('end', () => resolve(hash.digest('hex')));
    });
  });

  it('uploads unzipped files to Minio', async function () {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, build.getZipPath());

    const files = await unzip(build, stream);

    const minioKey = build.getFilePath(files[0].path);
    const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
    expect(result).to.exist;
  });
});
