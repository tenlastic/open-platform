import { podApiV1 } from '@tenlastic/kubernetes';
import {
  ICredentials,
  MongoosePermissions,
  PermissionError,
} from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';

import { Context, StatusCode } from '../definitions';
import { deleteUnsubscribeCallback, setUnsubscribeCallback } from './unsubscribe';

export interface LogsOptions {
  since?: string;
  tail?: number;
}

export async function logs(ctx: Context, Permissions: MongoosePermissions<any>) {
  const { _id } = ctx.request;
  const { container, pod } = ctx.params;
  const credentials: ICredentials = { ...ctx.state };
  const options: LogsOptions = { ...ctx.request.body };

  // Fetch record to check permissions.
  const override = { where: { _id: ctx.params._id } };
  const record = await Permissions.findOne(credentials, override, {});
  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = record.status.nodes.find((n) => n.container === container && n.pod === pod);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = await Permissions.getFieldPermissions(credentials, 'read', record);
  if (!permissions.includes('logs')) {
    throw new PermissionError();
  }

  // Start streaming the logs.
  const { abort, emitter } = await podApiV1.followNamespacedPodLog(
    node.pod,
    'dynamic',
    container || node.container,
    { since: options.since, tail: options.tail },
  );
  emitter.on('close', async () => ctx.ws.send({ _id, status: StatusCode.OK }));
  emitter.on('data', (log) => {
    let fullDocument: any;

    try {
      const json = JSON.parse(log.body);
      fullDocument = { body: json.message, level: json.level, unix: log.unix };
    } catch {
      fullDocument = log;
    }

    ctx.ws.send({ _id, body: { fullDocument }, status: StatusCode.PartialContent });
  });
  emitter.on('error', async (e) => {
    console.error(e.message);

    const errors = [{ message: e.message, name: e.name }];
    ctx.ws.send({ _id, body: { errors }, status: StatusCode.BadRequest });
  });

  // Register unsubscribe callback.
  setUnsubscribeCallback(_id, abort, ctx.ws);

  // Unsubscribe when the web socket is closed.
  ctx.ws.on('close', () => {
    abort();
    deleteUnsubscribeCallback(_id, ctx.ws);
  });

  ctx.response.status = StatusCode.Accepted;
}
