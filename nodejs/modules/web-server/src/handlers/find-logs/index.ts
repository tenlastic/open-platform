import { podApiV1 } from '@tenlastic/kubernetes';
import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { RecordNotFoundError } from '../../errors';
import { Context, FindLogsParameters, FindLogsRequest, FindLogsResponse } from '../../types';

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

export type FindLogsContext = Context<FindLogsParameters, FindLogsRequest, FindLogsResponse>;

export function findLogs<TDocument extends mongoose.Document & Record>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: FindLogsContext) {
    const context = { credentials: { ...ctx.state }, Model, options };

    // Check if the user can access the record.
    const override = { where: { _id: ctx.params._id } };
    const record = await dependencies.findOne(context, {}, override);
    if (!record) {
      throw new RecordNotFoundError('Record');
    }

    // Check if the record contains the requested node.
    const node = record.status.nodes.find(
      (n) => n.container === ctx.params.container && n.pod === ctx.params.pod,
    );
    if (!node) {
      throw new RecordNotFoundError('Record');
    }

    // Check if the user can access the record's logs.
    const fieldPermissions = await dependencies.getFieldPermissions(context, 'read', record);
    if (!fieldPermissions.includes('logs')) {
      throw new permissions.PermissionError();
    }

    try {
      const options = { since: ctx.request.query.since, tail: ctx.request.query.tail };
      const logs = await podApiV1.readNamespacedPodLog(
        node.pod,
        'dynamic',
        node.container,
        options,
      );

      const records = logs
        .map((l) => {
          try {
            const json = JSON.parse(l.body);
            return { body: json.message, level: json.level, unix: l.unix };
          } catch {
            return l;
          }
        })
        .filter((l) => l.body);

      ctx.response.body = { records };
    } catch {
      throw new RecordNotFoundError('Record');
    }
  };
}

export const dependencies = {
  findOne: permissions.findOne,
  getFieldPermissions: permissions.getFieldPermissions,
};
