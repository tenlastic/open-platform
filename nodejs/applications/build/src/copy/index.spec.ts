import * as minio from '@tenlastic/minio';
import {
  BuildDocument,
  BuildFileMock,
  BuildMock,
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

describe('copy', function () {
  let build: BuildDocument;
  let referenceBuild: BuildDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['builds'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    build = await BuildMock.create({ namespaceId: namespace._id });

    // Set up reference Build.
    referenceBuild = await BuildMock.create({
      files: [BuildFileMock.create({ path: 'index.spec.ts' })],
      namespaceId: namespace._id,
      publishedAt: new Date(),
    });
    const referenceBuildMinioKey = referenceBuild.getFilePath('index.spec.ts');
    await minio.putObject(
      process.env.MINIO_BUCKET,
      referenceBuildMinioKey,
      fs.createReadStream(__filename),
    );
  });

  it('copies files within Minio', async function () {
    const buildFile = await copy(build, 'index.spec.ts', referenceBuild);

    const minioKey = build.getFilePath(buildFile.path);
    const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
    expect(result).to.exist;
  });
});
