import * as minio from '@tenlastic/minio';
import {
  BuildDocument,
  BuildMock,
  File,
  FileMock,
  FilePlatform,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import { copy } from './';

use(chaiAsPromised);

describe('copy', function() {
  let build: BuildDocument;
  let platform: FilePlatform;
  let previousBuild: BuildDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['builds'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    build = await BuildMock.create({ namespaceId: namespace._id });
    platform = FileMock.getPlatform();
    previousBuild = await BuildMock.create({
      namespaceId: namespace._id,
      publishedAt: new Date(),
    });

    // Set up Previous Build.
    const previousFile = await FileMock.create({
      buildId: previousBuild._id,
      path: 'index.spec.ts',
      platform,
    });
    const previousFileMinioKey = await previousFile.getMinioKey();
    await minio.putObject(
      process.env.MINIO_BUCKET,
      previousFileMinioKey,
      fs.createReadStream(__filename),
    );
  });

  it('creates file records', async function() {
    await copy(build._id, 'index.spec.ts', platform, previousBuild._id);

    const file = await File.findOne({ buildId: build._id });
    expect(file.path).to.eql('index.spec.ts');
  });

  it('copies files within Minio', async function() {
    await copy(build._id, 'index.spec.ts', platform, previousBuild._id);

    const file = await File.findOne({ buildId: build._id });
    const minioKey = await file.getMinioKey();
    const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
    expect(result).to.exist;
  });
});
