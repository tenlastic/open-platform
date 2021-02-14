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
  const { buildId, platform } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const build = await Build.findOne({ _id: buildId });
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const file = await new File({ buildId, platform })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const createPermissions = FilePermissions.accessControl.getFieldPermissions('create', file, user);
  const updatePermissions = FilePermissions.accessControl.getFieldPermissions('update', file, user);
  if (createPermissions.length === 0 || updatePermissions.length === 0) {
    throw new PermissionError();
  }

  ctx.response.body = { tasks };
}

async function publishCopyMessage(fields: any, platform: FilePlatform, buildId: string, user: any) {
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
