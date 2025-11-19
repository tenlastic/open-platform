import { podApiV1 } from '@tenlastic/kubernetes';
import { DatabaseOperationType } from '@tenlastic/mongoose-nats';
import * as permissions from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { Context, StatusCode } from '../definitions';
import { deleteUnsubscribeCallback, setUnsubscribeCallback } from './unsubscribe';

export interface Log {
  body: string;
  level: string;
  unix: number;
}

export interface LogError {
  message: string;
  name: string;
}

export type LogsContext = Context<LogsRequest, LogsResponse>;

export interface LogsRequest {
  resumeToken?: string;
}

export interface LogsResponse {
  errors?: LogError[];
  fullDocument?: Log;
  operationType?: DatabaseOperationType;
  resumeToken?: number;
}

interface Node {
  container?: string;
  pod?: string;
}

interface Record {
  status?: Status;
}

interface Status {
  nodes?: Node[];
}

export async function logs<TDocument extends mongoose.Document & Record>(
  ctx: LogsContext,
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  const { _id } = ctx.request;
  const { container, pod } = ctx.params;
  const context = { credentials: { ...ctx.state }, Model, options };

  // Fetch record to check permissions.
  const overlayParameters = { where: { _id: ctx.params._id } };
  const record = await permissions.findOne(context, {}, overlayParameters);
  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = record.status.nodes.find((n) => n.container === container && n.pod === pod);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const fieldPermissions = await permissions.getFieldPermissions(context, 'read', record);
  if (!fieldPermissions.includes('logs')) {
    throw new permissions.PermissionError();
  }

  // Start streaming the logs.
  const { abort, emitter } = await podApiV1.followNamespacedPodLog(
    node.pod,
    'dynamic',
    container || node.container,
    { since: ctx.request.body.resumeToken },
  );
  emitter.on('close', async () => ctx.ws.send({ _id, status: StatusCode.OK }));
  emitter.on('data', (log) => {
    let fullDocument: Log;

    try {
      const json = JSON.parse(log.body);
      fullDocument = { body: json.message, level: json.level, unix: log.unix };
    } catch {
      fullDocument = log;
    }

    ctx.ws.send({
      _id,
      body: { fullDocument, operationType: 'insert', resumeToken: fullDocument.unix },
      status: StatusCode.PartialContent,
    });
  });
  emitter.on('error', async (e) => {
    console.error(e);

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
