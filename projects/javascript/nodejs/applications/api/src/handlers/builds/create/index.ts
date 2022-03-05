import * as minio from '@tenlastic/minio';
import { Build, BuildPermissions } from '@tenlastic/mongoose-models';
import { Context } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const build = new Build();
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', (field, stream) => {
      stream.on('error', reject);
      console.log(field);

      if (field === 'zip') {
        build.unzip = true;
        minio.putObject(process.env.MINIO_BUCKET, build.getZipPath(), stream);
      } else {
        stream.resume();
      }
    });
    busboy.on('field', (key, value) => {
      if (key === 'record') {
        build.set(JSON.parse(value));
      }
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  try {
    const result = await BuildPermissions.create(
      build.toObject(),
      { _id: build._id, unzip: build.unzip },
      user,
    );
    const record = await BuildPermissions.read(result, user);

    ctx.response.body = { record };
  } catch (e) {
    minio.removeObject(process.env.MINIO_BUCKET, build.getZipPath());
    throw e;
  }
}
