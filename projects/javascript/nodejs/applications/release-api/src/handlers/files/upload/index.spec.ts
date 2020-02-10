import * as rabbitmq from '@tenlastic/rabbitmq';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import {
  FileMock,
  FilePlatform,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
  ReleaseTask,
} from '../../../models';
import { COPY_QUEUE, REMOVE_QUEUE, UNZIP_QUEUE } from '../../../workers';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/upload', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let platform: FilePlatform;
    let previousRelease: ReleaseDocument;
    let release: ReleaseDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      platform = FileMock.getPlatform();
      previousRelease = await ReleaseMock.create({ gameId: game._id, publishedAt: new Date() });
      release = await ReleaseMock.create({ gameId: game._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('modified[]', 'index.spec.ts');
      form.append('previousReleaseId', previousRelease._id.toString());
      form.append('removed[]', 'swagger.yml');
      form.append('unmodified[]', 'index.ts');
      form.append('zip', stream);

      ctx = new ContextMock({
        params: {
          platform,
          releaseId: release._id,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('copies unmodified files from the previous release', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'copy').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'copy' });
      expect(releaseTask).to.exist;
      expect(releaseTask.metadata.previousReleaseId.toString()).to.eql(
        previousRelease._id.toString(),
      );
      expect(releaseTask.metadata.unmodified).to.eql(['index.ts']);

      return new Promise(resolve => {
        rabbitmq.consume(COPY_QUEUE, (channel, content, msg) => {
          expect(content._id).to.eql(releaseTask._id.toString());

          resolve();
        });
      });
    });

    it('deletes removed files from Minio', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'remove').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'remove' });
      expect(releaseTask).to.exist;
      expect(releaseTask.metadata.removed).to.eql(['swagger.yml']);

      return new Promise(resolve => {
        rabbitmq.consume(REMOVE_QUEUE, (channel, content, msg) => {
          expect(content._id).to.eql(releaseTask._id.toString());

          resolve();
        });
      });
    });

    it('uploads unzipped files to Minio', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.tasks.filter(j => j.action === 'unzip').length).to.eql(1);

      const releaseTask = await ReleaseTask.findOne({ action: 'unzip' });
      expect(releaseTask).to.exist;

      return new Promise(resolve => {
        rabbitmq.consume(UNZIP_QUEUE, (channel, content, msg) => {
          expect(content._id).to.eql(releaseTask._id.toString());

          resolve();
        });
      });
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const ctx = new ContextMock({
        params: {
          platform: FileMock.getPlatform(),
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
