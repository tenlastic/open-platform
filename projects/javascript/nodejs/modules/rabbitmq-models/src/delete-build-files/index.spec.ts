import * as minio from '@tenlastic/minio';
import {
  File,
  FileMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  BuildDocument,
  BuildTaskMock,
  BuildMock,
  NamespaceUserMock,
  BuildTask,
  BuildTaskDocument,
  FilePlatform,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { DeleteBuildFiles } from './';

use(chaiAsPromised);

describe('remove-build-files', function() {
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
    let keptFileMinioKey: string;
    let platform: FilePlatform;
    let build: BuildDocument;
    let buildTask: BuildTaskDocument;
    let removedFileMinioKey: string;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      platform = FileMock.getPlatform();
      build = await BuildMock.create({ namespaceId: namespace._id });
      buildTask = await BuildTaskMock.create({
        buildId: build._id,
        metadata: { removed: ['index.spec.ts'] },
        platform,
      });

      // Set up File to keep.
      const keptFile = await FileMock.create({
        buildId: build._id,
        path: 'index.ts',
        platform,
      });
      keptFileMinioKey = await keptFile.getMinioKey();
      await minio.putObject(
        process.env.MINIO_BUCKET,
        keptFileMinioKey,
        fs.createReadStream(__filename),
      );

      // Set up File to remove.
      const removedFile = await FileMock.create({
        buildId: build._id,
        path: 'index.spec.ts',
        platform,
      });
      removedFileMinioKey = await removedFile.getMinioKey();
      await minio.putObject(
        process.env.MINIO_BUCKET,
        removedFileMinioKey,
        fs.createReadStream(__filename),
      );
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await DeleteBuildFiles.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await DeleteBuildFiles.onMessage(channel as any, content, null);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('deletes file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await DeleteBuildFiles.onMessage(channel as any, content, null);

      const files = await File.find({ buildId: build._id });
      expect(files.length).to.eql(1);
      expect(files[0].path).to.eql('index.ts');
    });

    it('deletes files within Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await DeleteBuildFiles.onMessage(channel as any, content, null);

      const result = await minio.statObject(process.env.MINIO_BUCKET, keptFileMinioKey);
      expect(result).to.exist;

      const promise = minio.statObject(process.env.MINIO_BUCKET, removedFileMinioKey);
      return expect(promise).to.be.rejectedWith('Not Found');
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
      await DeleteBuildFiles.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('task.metadata.removed is not iterable');
    });
  });
});
