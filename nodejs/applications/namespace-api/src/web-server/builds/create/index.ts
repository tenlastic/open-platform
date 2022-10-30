import * as minio from '@tenlastic/minio';
import { Context } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { Build, BuildPermissions, Namespace } from '../../../mongodb';

export async function handler(ctx: Context) {
  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(0.1);
  namespace.checkMemoryLimit(100 * 1000 * 1000);

  const build = new Build();
  await new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', (name, stream) => {
      stream.on('error', reject);

      if (name === 'zip') {
        minio.putObject(process.env.MINIO_BUCKET, build.getZipPath(), stream);
      } else {
        stream.resume();
      }
    });
    busboy.on('field', (name, value) => {
      if (name === 'record') {
        build.set(JSON.parse(value));
      }
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  try {
    const credentials = { ...ctx.state };
    const result = await BuildPermissions.create(credentials, { _id: build._id }, build.toObject());
    const record = await BuildPermissions.read(credentials, result);

    ctx.response.body = { record };
  } catch (e) {
    await minio.removeObject(process.env.MINIO_BUCKET, build.getZipPath());
    throw e;
  }
}
