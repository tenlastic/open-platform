import {
  FileMock,
  FilePlatform,
  NamespaceMock,
  UserDocument,
  UserMock,
  BuildDocument,
  BuildMock,
  NamespaceUserMock,
  BuildTask,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import {
  BuildDockerImage,
  CopyBuildFiles,
  DeleteBuildFiles,
  UnzipBuildFiles,
} from '@tenlastic/rabbitmq-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as sinon from 'sinon';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/upload', function() {
  let buildBuildDockerImageSpy: sinon.SinonSpy;
  let copyBuildFilesSpy: sinon.SinonSpy;
  let deleteBuildFilesSpy: sinon.SinonSpy;
  let sandbox: sinon.SinonSandbox;
  let unzipBuildFilesSpy: sinon.SinonSpy;
  let user: UserDocument;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    sandbox.stub(rabbitmq, 'publish').resolves();

    buildBuildDockerImageSpy = sandbox.spy(BuildDockerImage, 'publish');
    copyBuildFilesSpy = sandbox.spy(CopyBuildFiles, 'publish');
    deleteBuildFilesSpy = sandbox.spy(DeleteBuildFiles, 'publish');
    unzipBuildFilesSpy = sandbox.spy(UnzipBuildFiles, 'publish');

    user = await UserMock.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let platform: FilePlatform;
    let previousBuild: BuildDocument;
    let build: BuildDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      platform = FileMock.getPlatform();
      previousBuild = await BuildMock.create({
        namespaceId: namespace._id,
        publishedAt: new Date(),
      });
      build = await BuildMock.create({ namespaceId: namespace._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('modified[]', 'index.spec.ts');
      form.append('previousBuildId', previousBuild._id.toString());
      form.append('removed[]', 'swagger.yml');
      form.append('unmodified[]', 'index.ts');
      form.append('zip', stream);

      ctx = new ContextMock({
        params: {
          buildId: build._id,
          platform,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('builds server image', async function() {
      ctx.params.platform = 'server64';

      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'build').length).to.eql(1);

      const buildTask = await BuildTask.findOne({ action: 'build' });
      expect(buildTask).to.exist;

      expect(buildBuildDockerImageSpy.called).to.eql(true);
    });

    it('copies unmodified files from the previous build', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'copy').length).to.eql(1);

      const buildTask = await BuildTask.findOne({ action: 'copy' });
      expect(buildTask).to.exist;
      expect(buildTask.metadata.previousBuildId.toString()).to.eql(previousBuild._id.toString());
      expect(buildTask.metadata.unmodified).to.eql(['index.ts']);

      expect(copyBuildFilesSpy.called).to.eql(true);
    });

    it('deletes removed files from Minio', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'remove').length).to.eql(1);

      const buildTask = await BuildTask.findOne({ action: 'remove' });
      expect(buildTask).to.exist;
      expect(buildTask.metadata.removed).to.eql(['swagger.yml']);

      expect(deleteBuildFilesSpy.called).to.eql(true);
    });

    it('uploads unzipped files to Minio', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'unzip').length).to.eql(1);

      const buildTask = await BuildTask.findOne({ action: 'unzip' });
      expect(buildTask).to.exist;

      expect(unzipBuildFilesSpy.called).to.eql(true);
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          buildId: build._id,
          platform: FileMock.getPlatform(),
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
