import * as minio from '@tenlastic/minio';
import {
  BuildDocument,
  BuildMock,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/upload', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let build: BuildDocument;
    let ctx: ContextMock;
    let form: FormData;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['builds'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      build = await BuildMock.new({ namespaceId: namespace._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('build', JSON.stringify(build));
      form.append('zip', stream);

      ctx = new ContextMock({
        params: {
          _id: build._id,
          platform: build.platform,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('returns the Build', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('uploads zip to Minio', async function() {
      await handler(ctx as any);

      await minio.statObject(process.env.MINIO_BUCKET, build.getZipPath());
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.new({ namespaceId: namespace._id });

      const form = new FormData();
      form.append('build', JSON.stringify(build));

      const ctx = new ContextMock({
        params: {
          _id: build._id,
        },
        req: form,
        state: { user: user.toObject() },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
