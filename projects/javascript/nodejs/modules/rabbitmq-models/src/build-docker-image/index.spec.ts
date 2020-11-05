import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import {
  FileMock,
  FilePlatform,
  NamespaceMock,
  BuildDocument,
  BuildTask,
  BuildTaskAction,
  BuildTaskDocument,
  BuildTaskMock,
  BuildMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { BuildDockerImage } from './';

use(chaiAsPromised);

describe('build-docker-image', function() {
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
    let build: BuildDocument;
    let buildTask: BuildTaskDocument;
    let platform: FilePlatform;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      platform = FileMock.getPlatform();
      build = await BuildMock.create({ namespaceId: namespace._id });
      buildTask = await BuildTaskMock.create({
        action: BuildTaskAction.Build,
        buildId: build._id,
        platform,
      });

      // Set up Files.
      const dockerFile = await FileMock.create({
        buildId: build._id,
        path: 'Dockerfile',
        platform,
      });
      const dockerFileContent = `
        FROM alpine:latest

        WORKDIR /home/
        COPY ./ ./

        CMD ["./Linux_Core.x86_64", "-batchmode", "-logFile", "-nographics"]
      `;
      const dockerFileMinioKey = await dockerFile.getMinioKey();
      await minio.putObject(process.env.MINIO_BUCKET, dockerFileMinioKey, dockerFileContent);

      const indexFile = await FileMock.create({
        buildId: build._id,
        path: 'index.ts',
        platform,
      });
      const indexFileMinioKey = await indexFile.getMinioKey();
      await minio.putObject(
        process.env.MINIO_BUCKET,
        indexFileMinioKey,
        fs.createReadStream(__filename),
      );

      const specFile = await FileMock.create({
        buildId: build._id,
        path: 'index.spec.ts',
        platform,
      });
      const specFileMinioKey = await specFile.getMinioKey();
      await minio.putObject(
        process.env.MINIO_BUCKET,
        specFileMinioKey,
        fs.createReadStream(__filename),
      );
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      const updatedJob = await BuildTask.findOne({ _id: buildTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('builds the Docker image', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      const response = await docker.inspect(
        build.namespaceId.toString(),
        buildTask.buildId.toString(),
      );
      expect(response.length).to.eql(1);
    });

    it('tags the Docker image with the registry url', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const repo = `${url.host}/${build.namespaceId}`;

      const response = await docker.inspect(repo, buildTask.buildId.toString());
      expect(response.length).to.eql(1);
    });

    it('pushes the image to the registry', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      const response = await docker.tags(build.namespaceId.toString());
      expect(response.tags).to.include(buildTask.buildId.toString());
    });
  });

  context('when unsuccessful', function() {
    it('nacks the message', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const channel = { nack: sinon.stub().resolves() };

      await BuildTaskMock.create({
        action: BuildTaskAction.Unzip,
        buildId: build._id,
      });
      const buildTask = await BuildTaskMock.create({
        action: BuildTaskAction.Build,
        buildId: build._id,
      });
      const content = buildTask.toObject();

      await BuildDockerImage.onMessage(channel as any, content, null);

      expect(channel.nack.calledOnce).to.eql(true);
    });
  });
});
