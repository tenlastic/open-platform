import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import {
  FileMock,
  FilePlatform,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

const bucket = process.env.MINIO_BUCKET;
use(chaiAsPromised);

describe('handlers/releases/delete', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let platform: FilePlatform;
    let record: ReleaseDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
      roles: ['releases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      record = await ReleaseMock.create({ namespaceId: namespace._id });

      platform = FileMock.getPlatform();
      const file = await FileMock.create({ path: 'index.ts', platform, releaseId: record._id });
      await minio.putObject(bucket, file.key, fs.createReadStream(__filename));
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('deletes removed files from Minio', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      const promise = minio.statObject(bucket, `${record._id}/${platform}/swagger.yml`);

      return expect(promise).to.be.rejectedWith('Not Found');
    });
  });

  context('when permission is denied', function() {
    let record: ReleaseDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await ReleaseMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
