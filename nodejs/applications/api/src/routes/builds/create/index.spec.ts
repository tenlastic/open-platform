import * as minio from '@tenlastic/minio';
import {
  AuthorizationMock,
  AuthorizationRole,
  BuildDocument,
  BuildMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/builds/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let build: BuildDocument;
    let ctx: ContextMock;
    let form: FormData;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.BuildsReadWrite],
        userId: user._id,
      });

      build = await BuildMock.new({ namespaceId: namespace._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('record', JSON.stringify(build));
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
        state: { user },
      } as any);
    });

    it('returns the Build', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('uploads zip to Minio', async function () {
      await handler(ctx as any);
      await new Promise((res) => setTimeout(res, 100));

      await minio.statObject(process.env.MINIO_BUCKET, build.getZipPath());
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.new({ namespaceId: namespace._id });

      const form = new FormData();
      form.append('record', JSON.stringify(build));

      const ctx = new ContextMock({
        params: { _id: build._id },
        req: form,
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
