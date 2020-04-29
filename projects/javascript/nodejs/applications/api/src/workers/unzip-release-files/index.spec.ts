import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as sinon from 'sinon';

import { MINIO_BUCKET } from '../../constants';
import {
  File,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseTaskAction,
  ReleaseTaskMock,
  ReleaseMock,
  UserRolesMock,
  ReleaseTask,
  ReleaseTaskDocument,
} from '../../models';
import { unzipReleaseFilesWorker } from './';

use(chaiAsPromised);

describe('workers/unzip', function() {
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
    let md5: string;
    let release: ReleaseDocument;
    let releaseTask: ReleaseTaskDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      const game = await GameMock.create({ namespaceId: namespace._id });

      release = await ReleaseMock.create({ gameId: game._id });
      releaseTask = await ReleaseTaskMock.create({ releaseId: release });

      // Upload zip to Minio.
      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));
      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });
      await minio.getClient().putObject(MINIO_BUCKET, releaseTask.minioZipObjectName, stream);

      // Calculate MD5 for zipped file.
      md5 = await new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(__filename);
        const hash = crypto.createHash('md5');
        hash.setEncoding('hex');
        fileStream.on('end', () => {
          hash.end();
          return resolve(hash.read() as string);
        });
        fileStream.on('error', reject);
        fileStream.pipe(hash);
      });
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await unzipReleaseFilesWorker(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await unzipReleaseFilesWorker(channel as any, content, null);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('creates file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await unzipReleaseFilesWorker(channel as any, content, null);

      const file = await File.findOne({ releaseId: release._id });
      expect(file.md5).to.eql(md5);
      expect(file.path).to.eql('index.spec.ts');
    });

    it('uploads unzipped files to Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await unzipReleaseFilesWorker(channel as any, content, null);

      const file = await File.findOne({ releaseId: release._id });
      const result = await minio.getClient().statObject(MINIO_BUCKET, file.key);
      expect(result).to.exist;
    });
  });

  context('when unsuccessful', function() {
    it('requeues the message', async function() {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves(false);

      const releaseTask = await ReleaseTaskMock.create({
        action: ReleaseTaskAction.Unzip,
        releaseId: release._id,
      });
      const content = releaseTask.toObject();
      await unzipReleaseFilesWorker({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('The specified key does not exist.');
    });
  });
});
