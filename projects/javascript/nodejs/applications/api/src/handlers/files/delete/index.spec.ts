import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as minio from '@tenlastic/minio';

import {
  FileDocument,
  FileMock,
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

describe('handlers/files/delete', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let release: ReleaseDocument;
    let record: FileDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['releases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      release = await ReleaseMock.create({ namespaceId: namespace._id });
      record = await FileMock.create({ releaseId: release._id });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('removes the object from minio', async function() {
      await minio.fPutObject(bucket, record.key, __filename, {});

      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      const promise = minio.statObject(bucket, record.key);
      expect(promise).to.be.rejected;
    });
  });

  context('when permission is denied', function() {
    let release: ReleaseDocument;
    let record: FileDocument;

    beforeEach(async function() {
      release = await ReleaseMock.create();
      record = await FileMock.create({ releaseId: release._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
