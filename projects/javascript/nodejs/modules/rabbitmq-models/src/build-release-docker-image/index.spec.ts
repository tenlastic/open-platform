import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import {
  FileMock,
  FilePlatform,
  NamespaceMock,
  ReleaseDocument,
  ReleaseTask,
  ReleaseTaskAction,
  ReleaseTaskDocument,
  ReleaseTaskMock,
  ReleaseMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as sinon from 'sinon';

import { BuildReleaseDockerImage } from './';

use(chaiAsPromised);

describe('build-release-docker-image', function() {
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
        action: ReleaseTaskAction.Build,
        platform,
        releaseId: release._id,
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
      await minio.putObject(process.env.MINIO_BUCKET, dockerFile.key, dockerFileContent);

      const indexFile = await FileMock.create({
        path: 'index.ts',
        platform,
        releaseId: release._id,
      });
      await minio.putObject(
        process.env.MINIO_BUCKET,
        indexFile.key,
        fs.createReadStream(__filename),
      );

      const specFile = await FileMock.create({
        path: 'index.spec.ts',
        platform,
        releaseId: release._id,
      });
      await minio.putObject(
        process.env.MINIO_BUCKET,
        specFile.key,
        fs.createReadStream(__filename),
      );
    });

    it('acks the message', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      expect(channel.ack.calledOnce).to.eql(true);
    });

    it('marks the task status complete', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      const updatedJob = await ReleaseTask.findOne({ _id: releaseTask._id });
      expect(updatedJob.completedAt).to.exist;
      expect(updatedJob.startedAt).to.exist;
    });

    it('builds the Docker image', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      const response = await docker.inspect(
        release.namespaceId.toString(),
        releaseTask.releaseId.toString(),
      );
      expect(response.length).to.eql(1);
    });

    it('tags the Docker image with the registry url', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const repo = `${url.host}/${release.namespaceId}`;

      const response = await docker.inspect(repo, releaseTask.releaseId.toString());
      expect(response.length).to.eql(1);
    });

    it('pushes the image to the registry', async function() {
      const channel = { ack: sinon.stub().resolves() };
      const content = releaseTask.toObject();

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      const response = await docker.tags(release.namespaceId.toString());
      expect(response.tags).to.include(releaseTask.releaseId.toString());
    });
  });

  context('when unsuccessful', function() {
    it('nacks the message', async function() {
      const namespace = await NamespaceMock.create();
      const release = await ReleaseMock.create({ namespaceId: namespace._id });

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

      await BuildReleaseDockerImage.onMessage(channel as any, content, null);

      expect(channel.nack.calledOnce).to.eql(true);
    });
  });
});
