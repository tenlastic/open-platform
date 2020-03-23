import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as request from 'request-promise-native';
import * as sinon from 'sinon';

import { MINIO_BUCKET } from '../../constants';
import {
  FileMock,
  FilePlatform,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseTaskAction,
  ReleaseTaskMock,
  ReleaseMock,
  UserRolesMock,
  ReleaseTask,
  ReleaseTaskDocument,
} from '../../models';
import { buildWorker } from './';

const options: Partial<request.OptionsWithUrl> = {};
if (process.env.DOCKER_CERT_PATH) {
  options.ca = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/ca.pem`);
  options.cert = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/cert.pem`);
  options.key = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/key.pem`);
  options.rejectUnauthorized = false;
}
use(chaiAsPromised);

describe('workers/build', function() {
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
    let releaseTask: ReleaseTaskDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      platform = FileMock.getPlatform();
      release = await ReleaseMock.create({ gameId: game._id });
      releaseTask = await ReleaseTaskMock.create({
        action: ReleaseTaskAction.Build,
        platform,
        releaseId: release,
      });

      // Set up Files.
      const dockerFile = await FileMock.create({
        path: 'Dockerfile',
        platform,
        releaseId: release._id,
      });
      const dockerFileContent = `
        FROM alpine:latest

        WORKDIR /home/
        COPY ./ ./

        CMD ["./Linux_Core.x86_64", "-batchmode", "-logFile", "-nographics"]
      `;
      await minio.getClient().putObject(MINIO_BUCKET, dockerFile.key, dockerFileContent);

      const indexFile = await FileMock.create({
        path: 'index.ts',
        platform,
        releaseId: release._id,
      });
      await minio
        .getClient()
        .putObject(MINIO_BUCKET, indexFile.key, fs.createReadStream(__filename));

      const specFile = await FileMock.create({
        path: 'index.spec.ts',
        platform,
        releaseId: release._id,
      });
      await minio
        .getClient()
        .putObject(MINIO_BUCKET, specFile.key, fs.createReadStream(__filename));
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('builds the Docker image', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      const tag = `${release.gameId}:${releaseTask.releaseId}`;
      const response = await request.get({
        ...options,
        json: true,
        url: `${process.env.DOCKER_ENGINE_URL}/images/json?filters={"reference":["${tag}"]}`,
      });

      expect(response.length).to.eql(1);
    });

    it('tags the Docker image with the registry url', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const repo = `${url.host}/${release.gameId}`;
      const tag = `${repo}:${releaseTask.releaseId}`;

      const response = await request.get({
        ...options,
        json: true,
        url: `${process.env.DOCKER_ENGINE_URL}/images/json?filters={"reference":["${tag}"]}`,
      });

      expect(response.length).to.eql(1);
    });

    it('pushes the image to the registry', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      const response = await request.get({
        json: true,
        url: `${process.env.DOCKER_REGISTRY_URL}/v2/${release.gameId}/tags/list`,
      });

      expect(response.tags).to.include(releaseTask.releaseId.toString());
    });
  });

  context('when unsuccessful', function() {
    it('nacks the message', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const channel = { nack: sinon.stub().resolves() };

      await ReleaseTaskMock.create({
        action: ReleaseTaskAction.Unzip,
        releaseId: release._id,
      });
      const releaseTask = await ReleaseTaskMock.create({
        action: ReleaseTaskAction.Build,
        releaseId: release._id,
      });
      const content = releaseTask.toObject();

      await buildWorker(channel as any, content, null);

      expect(channel.nack.calledOnce).to.eql(true);
    });
  });
});
