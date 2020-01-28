import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';
import * as crypto from 'crypto';
import { Stream } from 'stream';
import * as unzipper from 'unzipper';

import { MINIO_BUCKET } from '../../../constants';
import {
  File,
  FileDocument,
  FilePermissions,
  FilePlatform,
  Release,
  ReleaseDocument,
} from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const file = await new File({ releaseId: release._id })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const permissions = FilePermissions.accessControl.getFieldPermissions(
    'create',
    file,
    ctx.state.user,
  );
  if (permissions.length === 0) {
    throw new PermissionError();
  }

  const fields: any = {};
  let promise: Promise<Array<Promise<FileDocument>>>;
  await new Promise<FileDocument[]>((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', (field, stream) => {
      if (field !== 'zip') {
        return;
      }

      promise = processZip(ctx.params.platform, release, stream);
    });
    busboy.on('field', (key, value) => {
      try {
        value = JSON.parse(value);
      } catch {}

      if (key.includes('[]')) {
        key = key.replace('[]', '');

        if (!fields[key]) {
          fields[key] = [];
        }

        fields[key].push(value);
      } else {
        fields[key] = value;
      }
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const promises = await promise;
  const records = await Promise.all(promises);

  // Copy files from previous Release.
  if (fields.previousReleaseId && fields.unmodified && fields.unmodified.length) {
    for (const path of fields.unmodified) {
      if (ctx.params.releaseId === fields.previousReleaseId) {
        continue;
      }

      const copiedFile = await copyObject(
        path,
        ctx.params.platform,
        fields.previousReleaseId,
        ctx.params.releaseId,
        ctx.state.user,
      );

      records.push(copiedFile);
    }
  }

  // Remove files from current Release.
  if (fields.removed && fields.removed.length) {
    for (const path of fields.removed) {
      const { platform, releaseId } = ctx.params;
      await File.findOneAndDelete({ path: path.replace(/[\.]+\//g, ''), platform, releaseId });
    }
  }

  ctx.response.body = { records };
}

async function copyObject(
  path: string,
  platform: string,
  previousReleaseId: string,
  releaseId: string,
  user: any,
) {
  path = path.replace(/[\.]+\//g, '');

  const previousFile = await File.findOne({ path, platform, releaseId: previousReleaseId });
  if (!previousFile) {
    throw new RecordNotFoundError('Previous File');
  }

  // Copy the previous file to the new release.
  await minio
    .getClient()
    .copyObject(
      MINIO_BUCKET,
      `${releaseId}/${previousFile.platform}/${path}`,
      `${MINIO_BUCKET}/${previousFile.releaseId}/${previousFile.platform}/${path}`,
      null,
    );

  return File.findOneAndUpdate(
    { path: previousFile.path, platform: previousFile.platform, releaseId },
    {
      md5: previousFile.md5,
      path: previousFile.path,
      platform: previousFile.platform,
      releaseId,
    },
    { new: true, upsert: true },
  );
}

function processZip(platform: FilePlatform, release: ReleaseDocument, stream: Stream) {
  const promises = [];

  return new Promise<Array<Promise<FileDocument>>>((resolve, reject) => {
    stream
      .pipe(unzipper.Parse())
      .on('entry', entry => {
        const { path, type } = entry;
        if (type === 'Directory') {
          return;
        }

        const record = new File({
          path: path.replace(/[\.]+\//g, ''),
          platform,
          releaseId: release._id,
        });

        try {
          const promise = saveFile(entry, record);
          promises.push(promise);
        } catch (e) {
          throw e;
        }
      })
      .on('error', reject)
      .on('finish', () => resolve(promises));
  });
}

async function saveFile(entry: any, record: FileDocument) {
  const results = await Promise.all([
    new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      hash.setEncoding('hex');
      entry.on('end', () => {
        hash.end();

        const md5 = hash.read();
        return resolve(md5);
      });
      entry.on('error', reject);
      entry.pipe(hash);
    }),
    minio.getClient().putObject(MINIO_BUCKET, record.key, entry),
  ]);

  return File.findOneAndUpdate(
    { path: record.path, platform: record.platform, releaseId: record.releaseId },
    {
      compressedBytes: entry.vars.compressedSize,
      md5: results[0],
      path: record.path,
      platform: record.platform,
      releaseId: record.releaseId,
      uncompressedBytes: entry.vars.uncompressedSize,
    },
    { new: true, upsert: true },
  );
}
