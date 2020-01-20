import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as crypto from 'crypto';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import {
  File,
  FileMock,
  FileSchema,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/files/upload', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let md5: string;
    let previousRelease: ReleaseDocument;
    let release: ReleaseDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      const platform = FileMock.getPlatform();
      previousRelease = await ReleaseMock.create({ gameId: game._id, publishedAt: new Date() });
      release = await ReleaseMock.create({ gameId: game._id });

      // Set up Previous Release.
      const previousFile = await FileMock.create({
        path: 'index.ts',
        platform,
        releaseId: previousRelease._id,
      });
      await minio
        .getClient()
        .putObject(
          FileSchema.bucket,
          `${previousRelease._id}/${platform}/index.ts`,
          fs.createReadStream(__filename),
        );

      const zip = new JSZip();
      zip.file('index.spec.ts', fs.createReadStream(__filename));

      const stream = zip.generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });

      form = new FormData();
      form.append('modified[]', 'index.spec.ts');
      form.append('previousReleaseId', previousRelease._id.toString());
      form.append('unmodified[]', 'index.ts');
      form.append('zip', stream);

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

      ctx = new ContextMock({
        params: {
          platform,
          releaseId: release._id,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
        },
        state: { user },
      } as any);
    });

    it('creates a new record', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.records).to.exist;
      expect(ctx.response.body.records.length).to.eql(2);
      expect(ctx.response.body.records[0].md5).to.eql(md5);
    });

    it('copies unmodified files from the previous release', async function() {
      await handler(ctx as any);

      const file = new File(ctx.response.body.records[0]);
      const result = await minio
        .getClient()
        .statObject(FileSchema.bucket, `${file.releaseId}/${file.platform}/index.ts`);

      expect(result).to.exist;
    });

    it('uploads unzipped files to Minio', async function() {
      await handler(ctx as any);

      const file = new File(ctx.response.body.records[0]);
      const result = await minio
        .getClient()
        .statObject(FileSchema.bucket, `${file.releaseId}/${file.platform}/index.spec.ts`);

      expect(result).to.exist;
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
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
