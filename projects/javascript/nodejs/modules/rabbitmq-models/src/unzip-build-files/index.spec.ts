import * as minio from '@tenlastic/minio';
import {
  File,
  NamespaceMock,
  BuildDocument,
  BuildMock,
  BuildTask,
  BuildTaskAction,
  BuildTaskDocument,
  BuildTaskMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as sinon from 'sinon';

import { UnzipBuildFiles } from './';

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
    let build: BuildDocument;
    let buildTask: BuildTaskDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      build = await BuildMock.create({ namespaceId: namespace._id });
      buildTask = await BuildTaskMock.create({ buildId: build._id });

      // Upload zip to Minio.
      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });
      const minioKey = await buildTask.getMinioKey();
      await minio.putObject(process.env.MINIO_BUCKET, minioKey, stream);

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
      const content = buildTask.toObject();

      await UnzipBuildFiles.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await UnzipBuildFiles.onMessage(channel as any, content, null);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('creates file records', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await UnzipBuildFiles.onMessage(channel as any, content, null);

      const file = await File.findOne({ buildId: build._id });
      expect(file.md5).to.eql(md5);
      expect(file.path).to.eql('index.spec.ts');
    });

    it('uploads unzipped files to Minio', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await UnzipBuildFiles.onMessage(channel as any, content, null);

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
        action: BuildTaskAction.Unzip,
        buildId: build._id,
      });
      const content = buildTask.toObject();
      await UnzipBuildFiles.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.failedAt).to.exist;
      expect(updatedJob.failures.length).to.eql(1);
      expect(updatedJob.failures[0].createdAt).to.exist;
      expect(updatedJob.failures[0].message).to.eql('The specified key does not exist.');
    });
  });
});
