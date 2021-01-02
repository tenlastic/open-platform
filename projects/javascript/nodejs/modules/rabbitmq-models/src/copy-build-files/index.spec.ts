import * as minio from '@tenlastic/minio';
import {
  File,
  FileMock,
  NamespaceMock,
  BuildDocument,
  BuildMock,
  BuildTask,
  BuildTaskDocument,
  BuildTaskMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { CopyBuildFiles } from './';

use(chaiAsPromised);

describe('copy-build-files', function() {
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
    let previousBuild: BuildDocument;
    let build: BuildDocument;
    let buildTask: BuildTaskDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      const platform = FileMock.getPlatform();
      build = await BuildMock.create({ namespaceId: namespace._id });
      previousBuild = await BuildMock.create({
        namespaceId: namespace._id,
        publishedAt: new Date(),
      });
      buildTask = await BuildTaskMock.create({
        buildId: build._id,
        metadata: { previousBuildId: previousBuild._id, unmodified: ['index.spec.ts'] },
        platform,
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

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await CopyBuildFiles.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await CopyBuildFiles.onMessage(channel as any, content, null);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('creates file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await CopyBuildFiles.onMessage(channel as any, content, null);

      const file = await File.findOne({ buildId: build._id });
      expect(file.path).to.eql('index.spec.ts');
    });

    it('copies files within Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await CopyBuildFiles.onMessage(channel as any, content, null);

      const file = await File.findOne({ buildId: build._id });
      const minioKey = await file.getMinioKey();
      const result = await minio.statObject(process.env.MINIO_BUCKET, minioKey);
      expect(result).to.exist;
    });
  });

  context('when unsuccessful', function() {
    it('requeues the message', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves(false);

      const buildTask = await BuildTaskMock.create({
        buildId: build._id,
      });
      const content = buildTask.toObject();
      await CopyBuildFiles.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('task.metadata.unmodified is not iterable');
    });
  });
});
