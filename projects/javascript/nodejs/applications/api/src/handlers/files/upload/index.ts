import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';
import { Stream } from 'stream';

import { MINIO_BUCKET } from '../../../constants';
import {
  File,
  FileDocument,
  FilePermissions,
  FilePlatform,
  Release,
  ReleaseTask,
  ReleaseTaskAction,
  ReleaseTaskDocument,
} from '@tenlastic/mongoose-models';
import {
  BUILD_RELEASE_SERVER_QUEUE,
  COPY_RELEASE_FILES_QUEUE,
  REMOVE_RELEASE_FILES_QUEUE,
  UNZIP_RELEASE_FILES_QUEUE,
} from '../../../workers';

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
  let promise: Promise<ReleaseTaskDocument>;
  await new Promise<FileDocument[]>((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', async (field, stream) => {
      if (field !== 'zip') {
        return;
      }

      fields['zip'] = stream;
      promise = publishUnzipMessage(
        ctx.params.platform,
        ctx.params.releaseId,
        stream,
        ctx.state.user,
      );
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

  // Copy files from previous Release.
  let copyJob: ReleaseTaskDocument;
  if (fields.previousReleaseId && fields.unmodified && fields.unmodified.length) {
    copyJob = await publishCopyMessage(
      fields,
      ctx.params.platform,
      ctx.params.releaseId,
      ctx.state.user,
    );
  }

  // Remove files from current Release.
  let removeJob: ReleaseTaskDocument;
  if (fields.removed && fields.removed.length) {
    removeJob = await publishRemoveMessage(
      fields,
      ctx.params.platform,
      ctx.params.releaseId,
      ctx.state.user,
    );
  }

  // Upload zip to Minio.
  let unzipJob: ReleaseTaskDocument;
  if (Object.keys(fields).includes('zip')) {
    unzipJob = await promise;
  }

  // Build Docker images for server files.
  let buildJob: ReleaseTaskDocument;
  if (ctx.params.platform === 'server64') {
    buildJob = await publishBuildMessage(ctx.params.platform, ctx.params.releaseId, ctx.state.user);
  }

  // Return tasks in response.
  const tasks = [];
  if (buildJob) {
    tasks.push(buildJob);
  }
  if (copyJob) {
    tasks.push(copyJob);
  }
  if (removeJob) {
    tasks.push(removeJob);
  }
  if (unzipJob) {
    tasks.push(unzipJob);
  }

  ctx.response.body = { tasks };
}

async function publishBuildMessage(platform: FilePlatform, releaseId: string, user: any) {
  // If the user does not have permission to create Files for this Release, throw an error.
  const targetFile = await new File({ platform, releaseId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const createPermissions = FilePermissions.accessControl.getFieldPermissions(
    'create',
    targetFile,
    user,
  );
  if (createPermissions.length === 0) {
    throw new PermissionError();
  }

  const session = await ReleaseTask.db.startSession();
  session.startTransaction();

  let releaseTask: ReleaseTaskDocument;
  try {
    releaseTask = await ReleaseTask.create({
      action: ReleaseTaskAction.Build,
      platform: targetFile.platform,
      releaseId: targetFile.releaseId,
    });
    await rabbitmq.publish(BUILD_RELEASE_SERVER_QUEUE, releaseTask);

    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();

    throw e;
  }

  return releaseTask;
}

async function publishCopyMessage(
  fields: any,
  platform: FilePlatform,
  releaseId: string,
  user: any,
) {
  // If the previous Release and target Release are the same, do not queue the message.
  if (releaseId === fields.previousReleaseId) {
    return;
  }

  // If the user does not have permission to create Files for this Release, throw an error.
  const targetFile = await new File({ platform, releaseId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const createPermissions = FilePermissions.accessControl.getFieldPermissions(
    'create',
    targetFile,
    user,
  );
  if (createPermissions.length === 0) {
    throw new PermissionError();
  }

  // If the user does not have permission to read files from the previous Release, throw an error.
  const previousFile = await new File({ platform, releaseId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const readPermissions = FilePermissions.accessControl.getFieldPermissions(
    'read',
    previousFile,
    user,
  );
  if (readPermissions.length === 0) {
    throw new PermissionError();
  }

  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Copy,
    metadata: {
      previousReleaseId: fields.previousReleaseId,
      unmodified: fields.unmodified,
    },
    platform: targetFile.platform,
    releaseId: targetFile.releaseId,
  });
  await rabbitmq.publish(COPY_RELEASE_FILES_QUEUE, releaseTask);

  return releaseTask;
}

async function publishRemoveMessage(
  fields: any,
  platform: FilePlatform,
  releaseId: string,
  user: any,
) {
  // If the user does not have permission to delete Files for this Release, throw an error.
  const targetFile = await new File({ platform, releaseId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const deletePermissions = FilePermissions.accessControl.delete(targetFile, user);
  if (!deletePermissions) {
    throw new PermissionError();
  }

  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Remove,
    metadata: { removed: fields.removed },
    platform: targetFile.platform,
    releaseId: targetFile.releaseId,
  });
  await rabbitmq.publish(REMOVE_RELEASE_FILES_QUEUE, releaseTask);

  return releaseTask;
}

async function publishUnzipMessage(
  platform: FilePlatform,
  releaseId: string,
  stream: Stream,
  user: any,
) {
  // If the user does not have permission to create Files for this Release, throw an error.
  const targetFile = await new File({ platform, releaseId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const createPermissions = FilePermissions.accessControl.getFieldPermissions(
    'create',
    targetFile,
    user,
  );
  if (createPermissions.length === 0) {
    throw new PermissionError();
  }

  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Unzip,
    platform: targetFile.platform,
    releaseId: targetFile.releaseId,
  });

  await minio.putObject(MINIO_BUCKET, releaseTask.minioZipObjectName, stream);
  await rabbitmq.publish(UNZIP_RELEASE_FILES_QUEUE, releaseTask);

  return releaseTask;
}
