import * as minio from '@tenlastic/minio';
import {
  BuildDocument,
  BuildMock,
  BuildPlatform,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as mongoose from 'mongoose';

import { unzip } from './';

use(chaiAsPromised);

describe('unzip', function() {
  let build: BuildDocument;
  let md5: string;
  let platform: BuildPlatform;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['builds'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    build = await BuildMock.create({ namespaceId: namespace._id });
    platform = BuildPlatform.Server64;

    // Upload zip to Minio.
    const zip = new JSZip();
    zip.file('index.spec.ts', fs.createReadStream(__filename));

    const stream = zip.generateNodeStream({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
    });
    await minio.putObject(process.env.MINIO_BUCKET, build.getZipPath(), stream);

    // Calculate MD5 for zipped file.
    md5 = await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(__filename);
      const hash = crypto.createHash('md5');
      fileStream.on('error', err => reject(err));
      fileStream.on('data', chunk => hash.update(chunk));
      fileStream.on('end', () => resolve(hash.digest('hex')));
    });
  });

  it('uploads unzipped files to Minio', async function() {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, build.getZipPath());

    const files = await unzip(build, stream);

    const minioKey = build.getFilePath(files[0].path);
    const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
    expect(result).to.exist;
  });
});
