import {
  File,
  FileDocument,
  FilePermissions,
  FilePlatform,
  Build,
  BuildTaskDocument,
  BuildTaskPermissions,
} from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import {
  BuildDockerImage,
  CopyBuildFiles,
  DeleteBuildFiles,
  UnzipBuildFiles,
} from '@tenlastic/rabbitmq-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';
import * as mongoose from 'mongoose';
import { Stream } from 'stream';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const build = await Build.findOne({ _id: ctx.params.buildId });
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const file = await new File({ buildId: build._id })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const permissions = FilePermissions.accessControl.getFieldPermissions('create', file, user);
  if (permissions.length === 0) {
    throw new PermissionError();
  }

  const fields: any = {};
  let promise: Promise<BuildTaskDocument>;
  await new Promise<FileDocument[]>((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', async (field, stream) => {
      if (field !== 'zip') {
        return;
      }

      fields['zip'] = stream;
      promise = publishUnzipMessage(ctx.params.platform, ctx.params.buildId, stream, user);
    });
    busboy.on('field', (key, value) => {
      try {
        value = JSON.parse(value);
      } catch {}

      if (key.includes('[]')) {
        key = key.replace('[]', '');
        fields[key] = fields[key] || [];
        fields[key].push(value);
      } else {
        fields[key] = value;
      }
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  // Copy files from previous Build.
  let copyJob: BuildTaskDocument;
  if (fields.previousBuildId && fields.unmodified && fields.unmodified.length) {
    copyJob = await publishCopyMessage(fields, ctx.params.platform, ctx.params.buildId, user);
  }

  // Remove files from current Build.
  let removeJob: BuildTaskDocument;
  if (fields.removed && fields.removed.length) {
    removeJob = await publishRemoveMessage(fields, ctx.params.platform, ctx.params.buildId, user);
  }

  // Upload zip to Minio.
  let unzipJob: BuildTaskDocument;
  if (Object.keys(fields).includes('zip')) {
    unzipJob = await promise;
  }

  // Build Docker images for server files.
  let buildJob: BuildTaskDocument;
  if (ctx.params.platform === 'server64') {
    buildJob = await publishBuildMessage(ctx.params.platform, ctx.params.buildId, user);
  }

  // Return tasks in response.
  const tasks = [];
  if (buildJob) {
    const job = await BuildTaskPermissions.read(buildJob, user);
    tasks.push(job);
  }
  if (copyJob) {
    const job = await BuildTaskPermissions.read(copyJob, user);
    tasks.push(job);
  }
  if (removeJob) {
    const job = await BuildTaskPermissions.read(removeJob, user);
    tasks.push(job);
  }
  if (unzipJob) {
    const job = await BuildTaskPermissions.read(unzipJob, user);
    tasks.push(job);
  }

  ctx.response.body = { tasks };
}

async function publishBuildMessage(platform: FilePlatform, buildId: string, user: any) {
  // If the user does not have permission to create Files for this Build, throw an error.
  const targetFile = await new File({ platform, buildId })
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

  return BuildDockerImage.publish(
    targetFile.platform,
    targetFile.buildId as mongoose.Types.ObjectId,
  );
}

async function publishCopyMessage(fields: any, platform: FilePlatform, buildId: string, user: any) {
  // If the previous Build and target Build are the same, do not queue the message.
  if (buildId === fields.previousBuildId) {
    return;
  }

  // If the user does not have permission to create Files for this Build, throw an error.
  const targetFile = await new File({ platform, buildId })
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

  // If the user does not have permission to read files from the previous Build, throw an error.
  const previousFile = await new File({ platform, buildId })
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

  return CopyBuildFiles.publish(
    targetFile.platform,
    fields.previousBuildId,
    targetFile.buildId as mongoose.Types.ObjectId,
    fields.unmodified,
  );
}

async function publishRemoveMessage(
  fields: any,
  platform: FilePlatform,
  buildId: string,
  user: any,
) {
  // If the user does not have permission to delete Files for this Build, throw an error.
  const targetFile = await new File({ platform, buildId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const deletePermissions = FilePermissions.accessControl.delete(targetFile, user);
  if (!deletePermissions) {
    throw new PermissionError();
  }

  return DeleteBuildFiles.publish(
    targetFile.platform,
    targetFile.buildId as mongoose.Types.ObjectId,
    fields.removed,
  );
}

async function publishUnzipMessage(
  platform: FilePlatform,
  buildId: string,
  stream: Stream,
  user: any,
) {
  // If the user does not have permission to create Files for this Build, throw an error.
  const targetFile = await new File({ platform, buildId })
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

  return UnzipBuildFiles.publish(
    targetFile.platform,
    targetFile.buildId as mongoose.Types.ObjectId,
    stream,
  );
}
