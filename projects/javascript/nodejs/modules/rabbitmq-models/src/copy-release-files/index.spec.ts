import * as minio from '@tenlastic/minio';
import {
  File,
  FileMock,
  NamespaceMock,
  ReleaseDocument,
  ReleaseMock,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { CopyReleaseFiles } from './';

use(chaiAsPromised);

describe('copy-release-files', function() {
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
    let previousRelease: ReleaseDocument;
    let release: ReleaseDocument;
    let releaseTask: ReleaseTaskDocument;

    beforeEach(async function() {
      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

      const platform = FileMock.getPlatform();
      release = await ReleaseMock.create({ namespaceId: namespace._id });
      previousRelease = await ReleaseMock.create({
        namespaceId: namespace._id,
        publishedAt: new Date(),
      });
      releaseTask = await ReleaseTaskMock.create({
        metadata: { previousReleaseId: previousRelease._id, unmodified: ['index.spec.ts'] },
        platform,
        releaseId: release._id,
      });

      // Set up Previous Release.
      const previousFile = await FileMock.create({
        path: 'index.spec.ts',
        platform,
        releaseId: previousRelease._id,
      });
      await minio.putObject(
        process.env.MINIO_BUCKET,
        previousFile.key,
        fs.createReadStream(__filename),
      );
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await CopyReleaseFiles.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await CopyReleaseFiles.onMessage(channel as any, content, null);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('creates file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await CopyReleaseFiles.onMessage(channel as any, content, null);

      const file = await File.findOne({ releaseId: release._id });
      expect(file.path).to.eql('index.spec.ts');
    });

    it('copies files within Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await CopyReleaseFiles.onMessage(channel as any, content, null);

      const file = await File.findOne({ releaseId: release._id });
      const result = await minio.statObject(process.env.MINIO_BUCKET, file.key);
      expect(result).to.exist;
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
      await CopyReleaseFiles.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('task.metadata.unmodified is not iterable');
    });
  });
});
