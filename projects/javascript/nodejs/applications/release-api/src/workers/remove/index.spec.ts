import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { MINIO_BUCKET } from '../../constants';
import {
  File,
  FileMock,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseJobMock,
  ReleaseMock,
  UserRolesMock,
  ReleaseJob,
  ReleaseJobDocument,
  FilePlatform,
} from '../../models';
import { removeWorker } from './';

use(chaiAsPromised);

describe('workers/remove', function() {
  let sandbox: sinon.SinonSandbox;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    user = await ReadonlyUserMock.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when successful', function() {
    let platform: FilePlatform;
    let release: ReleaseDocument;
    let releaseJob: ReleaseJobDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      platform = FileMock.getPlatform();
      release = await ReleaseMock.create({ gameId: game._id });
      releaseJob = await ReleaseJobMock.create({
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
      await minio
        .getClient()
        .putObject(MINIO_BUCKET, keptFile.key, fs.createReadStream(__filename));

      // Set up File to remove.
      const removedFile = await FileMock.create({
        path: 'index.spec.ts',
        platform,
        releaseId: release._id,
      });
      await minio
        .getClient()
        .putObject(MINIO_BUCKET, removedFile.key, fs.createReadStream(__filename));
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseJob.toObject();

      await removeWorker(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the job status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseJob.toObject();

      await removeWorker(channel as any, content, null);

      const updatedJob = await ReleaseJob.findOne({ _id: releaseJob._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('deletes file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseJob.toObject();

      await removeWorker(channel as any, content, null);

      const files = await File.find({ releaseId: release._id });
      expect(files.length).to.eql(1);
      expect(files[0].path).to.eql('index.ts');
    });

    it('deletes files within Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseJob.toObject();

      await removeWorker(channel as any, content, null);

      const result = await minio
        .getClient()
        .statObject(MINIO_BUCKET, `${release._id}/${platform}/index.ts`);
      expect(result).to.exist;

      const promise = minio
        .getClient()
        .statObject(MINIO_BUCKET, `${release._id}/${platform}/index.spec.ts`);
      return expect(promise).to.be.rejectedWith('Not Found');
    });
  });

  context('when unsuccessful', function() {
    it('requeues the message', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves();

      const releaseJob = await ReleaseJobMock.create({
        releaseId: release._id,
      });
      const content = releaseJob.toObject();
      await removeWorker({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await ReleaseJob.findOne({ _id: releaseJob._id });
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('job.metadata.removed is not iterable');
    });
  });
});
