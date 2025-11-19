import * as minio from '@tenlastic/minio';
import {
  AuthorizationModel,
  AuthorizationRole,
  BuildDocument,
  BuildModel,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock, CreateContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { IncomingMessage } from 'http';
import * as JSZip from 'jszip';
import { Readable } from 'stream';

import { MinioBuild } from '../../../../minio';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/builds/create', function () {
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    namespace = await NamespaceModel.mock({
      limits: NamespaceLimitsModel.mock({
        cpu: 0.1,
        memory: 100 * 1000 * 1000,
        storage: 1 * 1000 * 1000 * 1000,
      }),
    }).save();
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let build: BuildDocument;
    let ctx: CreateContext<BuildDocument>;
    let form: FormData;
    let stream: NodeJS.ReadableStream;

    beforeEach(async function () {
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.BuildsRead, AuthorizationRole.BuildsWrite],
        userId: user._id,
      }).save();

      build = BuildModel.mock({ namespaceId: namespace._id });

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('record', JSON.stringify(build));

      ctx = ContextMock({
        params: { _id: build._id, namespaceId: namespace._id, platform: build.platform },
        req: form as Readable as IncomingMessage,
        request: { headers: form.getHeaders() },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('returns the Build', async function () {
      form.append('zip', stream, { contentType: 'application/zip', filename: 'example.zip' });

      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
    });

    it('uploads zip to Minio', async function () {
      form.append('zip', stream, { contentType: 'application/zip', filename: 'example.zip' });

      await handler(ctx);

      await minio.statObject(process.env.MINIO_BUCKET, MinioBuild.getZipObjectName(build));
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('zip', 'example', { contentType: 'image/x-icon', filename: 'example.ico' });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith('Mimetype must be: application/zip.');
    });

    it('does not allow more than one file', async function () {
      form.append('one', stream, { contentType: 'application/zip', filename: 'example.zip' });
      form.append('two', stream, { contentType: 'application/zip', filename: 'example.zip' });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith('Cannot upload more than one file at once.');
    });

    it('does not exceed Namespace CPU Limit', async function () {
      form.append('zip', stream, { contentType: 'application/zip', filename: 'example.zip' });

      namespace.limits.cpu = 0.05;
      await namespace.save();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });

    it('does not exceed Namespace Storage Limit', async function () {
      form.append('zip', stream, { contentType: 'application/zip', filename: 'example.zip' });

      namespace.limits.storage = 1;
      await namespace.save();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const build = BuildModel.mock({ namespaceId: namespace._id });

      const form = new FormData();
      form.append('record', JSON.stringify(build));

      const req = Readable.from(form.getBuffer()) as IncomingMessage;
      req.headers = form.getHeaders();
      req.method = 'POST';

      const ctx = ContextMock<CreateContext<BuildDocument>>({
        params: { namespaceId: namespace._id },
        req,
        request: { headers: form.getHeaders() },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
