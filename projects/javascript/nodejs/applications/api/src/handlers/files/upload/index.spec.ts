import * as rabbitmq from '@tenlastic/rabbitmq';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as sinon from 'sinon';

import {
  FileMock,
  FilePlatform,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
  ReleaseTask,
} from '../../../models';
import {
  COPY_RELEASE_FILES_QUEUE,
  REMOVE_RELEASE_FILES_QUEUE,
  UNZIP_RELEASE_FILES_QUEUE,
  BUILD_RELEASE_SERVER_QUEUE,
} from '../../../workers';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/upload', function() {
  let sandbox: sinon.SinonSandbox;
  let user: UserDocument;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    user = await UserMock.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let platform: FilePlatform;
    let previousRelease: ReleaseDocument;
    let release: ReleaseDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      const game = await GameMock.create({ namespaceId: namespace._id });

      platform = FileMock.getPlatform();
      previousRelease = await ReleaseMock.create({ gameId: game._id, publishedAt: new Date() });
      release = await ReleaseMock.create({ gameId: game._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('modified[]', 'index.spec.ts');
      form.append('previousReleaseId', previousRelease._id.toString());
      form.append('removed[]', 'swagger.yml');
      form.append('unmodified[]', 'index.ts');
      form.append('zip', stream);

      ctx = new ContextMock({
        params: {
          platform,
          releaseId: release._id,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('builds server image', async function() {
      const publishStub = sandbox.stub(rabbitmq, 'publish').resolves();
      ctx.params.platform = 'server64';

      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'build').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'build' });
      expect(releaseTask).to.exist;

      expect(publishStub.called).to.eql(true);

      const call = publishStub.getCalls().find(c => c.args[0] === BUILD_RELEASE_SERVER_QUEUE);
      expect(call).to.exist;
    });

    it('copies unmodified files from the previous release', async function() {
      const publishStub = sandbox.stub(rabbitmq, 'publish').resolves();

      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'copy').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'copy' });
      expect(releaseTask).to.exist;
      expect(releaseTask.metadata.previousReleaseId.toString()).to.eql(
        previousRelease._id.toString(),
      );
      expect(releaseTask.metadata.unmodified).to.eql(['index.ts']);

      expect(publishStub.called).to.eql(true);

      const call = publishStub.getCalls().find(c => c.args[0] === COPY_RELEASE_FILES_QUEUE);
      expect(call).to.exist;
    });

    it('deletes removed files from Minio', async function() {
      const publishStub = sandbox.stub(rabbitmq, 'publish').resolves();

      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'remove').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'remove' });
      expect(releaseTask).to.exist;
      expect(releaseTask.metadata.removed).to.eql(['swagger.yml']);

      expect(publishStub.called).to.eql(true);

      const call = publishStub.getCalls().find(c => c.args[0] === REMOVE_RELEASE_FILES_QUEUE);
      expect(call).to.exist;
    });

    it('uploads unzipped files to Minio', async function() {
      const publishStub = sandbox.stub(rabbitmq, 'publish').resolves();

      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'unzip').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'unzip' });
      expect(releaseTask).to.exist;

      expect(publishStub.called).to.eql(true);

      const call = publishStub.getCalls().find(c => c.args[0] === UNZIP_RELEASE_FILES_QUEUE);
      expect(call).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const ctx = new ContextMock({
        params: {
          platform: FileMock.getPlatform(),
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
