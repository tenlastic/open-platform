import * as minio from '@tenlastic/minio';
import {
  BuildDocument,
  BuildMock,
  File,
  FilePlatform,
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
  let key: string;
  let md5: string;
  let platform: FilePlatform;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['builds'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    build = await BuildMock.create({ namespaceId: namespace._id });
    platform = FilePlatform.Server64;

    const random = new mongoose.Types.ObjectId();
    key = `namespaces/${namespace._id}/builds/${build._id}/archives/${random}.zip`;

    // Upload zip to Minio.
    const zip = new JSZip();
    zip.file('index.spec.ts', fs.createReadStream(__filename));

    const stream = zip.generateNodeStream({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
    });
    await minio.putObject(process.env.MINIO_BUCKET, key, stream);

    // Calculate MD5 for zipped file.
    md5 = await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(__filename);
      const hash = crypto.createHash('md5');
      fileStream.on('error', err => reject(err));
      fileStream.on('data', chunk => hash.update(chunk));
      fileStream.on('end', () => resolve(hash.digest('hex')));
    });
  });

  it('creates file records', async function() {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, key);

    await unzip(build._id, platform, stream);

    const file = await File.findOne({ buildId: build._id });
    expect(file.md5).to.eql(md5);
    expect(file.path).to.eql('index.spec.ts');
  });

  it('uploads unzipped files to Minio', async function() {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, key);

    await unzip(build._id, platform, stream);

    const file = await File.findOne({ buildId: build._id });
    const minioKey = await file.getMinioKey();
    const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
    expect(result).to.exist;
  });
});
