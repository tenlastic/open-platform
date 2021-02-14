import * as minio from '@tenlastic/minio';
import {
  Build,
  BuildPermissions,
  BuildWorkflow,
  File,
  FileDocument,
  FilePermissions,
} from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const { buildId, platform } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const build = await Build.findOne({ _id: buildId });
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const file = await new File({ buildId })
    .populate(FilePermissions.accessControl.options.populate)
    .execPopulate();
  const role = FilePermissions.accessControl.getRole(file, user);
  if (!['namespace-administrator', 'system-administrator', 'user-administrator'].includes(role)) {
    throw new PermissionError();
  }

  const buildWorkflow = new BuildWorkflow({ buildId, namespaceId: build.namespaceId, platform });

  await new Promise<FileDocument[]>((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', async (field, stream) => {
      if (field !== 'zip') {
        return;
      }

      if (!buildWorkflow.previousBuildId) {
        busboy.emit('error', new RequiredFieldError(['previousBuildId']));
        return;
      } else {
        const previousBuild = await Build.findOne({ _id: buildWorkflow.previousBuildId });
        const permissions = BuildPermissions.accessControl.getFieldPermissions(
          'read',
          previousBuild,
          user,
        );

        if (permissions.length === 0) {
          busboy.emit('error', new PermissionError());
          return;
        }
      }

      minio.putObject(process.env.MINIO_BUCKET, buildWorkflow.zip, stream);
    });
    busboy.on('field', (key, value) => {
      if (!['deleted', 'previousBuildId', 'unmodified'].includes(key)) {
        return;
      }

      try {
        value = JSON.parse(value);
      } catch {}

      if (key.includes('[]')) {
        key = key.replace('[]', '');
        buildWorkflow[key] = buildWorkflow[key] || [];
        buildWorkflow[key].push(value);
      } else {
        buildWorkflow[key] = value;
      }
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  await buildWorkflow.save();

  ctx.response.body = { record: buildWorkflow };
}
