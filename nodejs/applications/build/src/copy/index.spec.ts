import * as minio from '@tenlastic/minio';
import { BuildModel } from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as fs from 'fs';

import { copy } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('copy', function () {
  let build: BuildModel;
  let referenceBuild: BuildModel;

  beforeEach(async function () {
    const namespaceId = chance.hash();
    build = new BuildModel({ _id: chance.hash(), namespaceId });

    // Set up reference Build.
    referenceBuild = new BuildModel({
      _id: chance.hash(),
      files: [{ path: 'index.spec.ts' }],
      namespaceId,
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
