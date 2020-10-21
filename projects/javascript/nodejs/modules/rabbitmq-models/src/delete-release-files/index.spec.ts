import * as minio from '@tenlastic/minio';
import {
  File,
  FileMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseTaskMock,
  ReleaseMock,
  NamespaceRolesMock,
  ReleaseTask,
  ReleaseTaskDocument,
  FilePlatform,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { DeleteReleaseFiles } from './';

use(chaiAsPromised);

describe('remove-release-files', function() {
  let sandbox: sinon.SinonSandbox;
  let user: UserDocument;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    user = await UserMock.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when successful', function() {
    let platform: FilePlatform;
    let release: ReleaseDocument;
    let releaseTask: ReleaseTaskDocument;

    beforeEach(async function() {
      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

      platform = FileMock.getPlatform();
      release = await ReleaseMock.create({ namespaceId: namespace._id });
      releaseTask = await ReleaseTaskMock.create({
        metadata: { removed: ['index.spec.ts'] },
        platform,
        releaseId: release._id,
      });

      // Set up File to keep.
      const keptFile = await FileMock.create({
        path: 'index.ts',
        platform,
        releaseId: release._id,
      });
      await minio.putObject(
        process.env.MINIO_BUCKET,
        keptFile.key,
        fs.createReadStream(__filename),
      );

      // Set up File to remove.
      const removedFile = await FileMock.create({
        path: 'index.spec.ts',
        platform,
        releaseId: release._id,
      });
      await minio.putObject(
        process.env.MINIO_BUCKET,
        removedFile.key,
        fs.createReadStream(__filename),
      );
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await DeleteReleaseFiles.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await DeleteReleaseFiles.onMessage(channel as any, content, null);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('deletes file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await DeleteReleaseFiles.onMessage(channel as any, content, null);

      const files = await File.find({ releaseId: release._id });
      expect(files.length).to.eql(1);
      expect(files[0].path).to.eql('index.ts');
    });

    it('deletes files within Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await DeleteReleaseFiles.onMessage(channel as any, content, null);

      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        `releases/${release._id}/${platform}/index.ts`,
      );
      expect(result).to.exist;

      const promise = minio.statObject(
        process.env.MINIO_BUCKET,
        `releases/${release._id}/${platform}/index.spec.ts`,
      );
      return expect(promise).to.be.rejectedWith('Not Found');
    });
  });

  context('when unsuccessful', function() {
    it('requeues the message', async function() {
      const namespace = await NamespaceMock.create();
      const release = await ReleaseMock.create({ namespaceId: namespace._id });

      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves(false);

      const releaseTask = await ReleaseTaskMock.create({
        releaseId: release._id,
      });
      const content = releaseTask.toObject();
      await DeleteReleaseFiles.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('task.metadata.removed is not iterable');
    });
  });
});
