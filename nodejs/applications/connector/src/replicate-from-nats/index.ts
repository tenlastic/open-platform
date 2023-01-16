import { DatabasePayload } from '@tenlastic/mongoose-nats';
import * as mongoosePermissions from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import { Document as MongooseDocument, Model as MongooseModel, Query } from 'mongoose';
import { AckPolicy, DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';

import { getToModel } from '../schemas';

export interface ReplicateOptions {
  durable: string;
  start?: Date;
  subject: string;
  useUpdateDescription?: boolean;
}

/**
 * Applies all change events from the topic to the target collection.
 */
export async function replicateFromNats(
  collection: string,
  options: ReplicateOptions,
  where?: any,
) {
  const subscription = await nats.subscribe(options.subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    deliver_policy: DeliverPolicy.StartTime,
    durable_name: options.durable,
    inactive_threshold: 30 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
    opt_start_time: options.start?.toISOString(),
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    try {
      const Model = getToModel(collection);
      await eachMessage(Model, options, json, new Query().cast(Model, where));
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();
      process.exit(1);
    }
  }
}

export async function eachMessage(
  Model: MongooseModel<MongooseDocument>,
  options: ReplicateOptions,
  payload: DatabasePayload<MongooseDocument>,
  where?: any,
) {
  if (process.env.NODE_ENV !== 'test') {
    const _id = payload.fullDocument._id;
    console.log(`${payload.operationType} - ${payload.ns.db}.${payload.ns.coll} - ${_id}`);
  }

  if (where) {
    const fullDocument = new Model(payload.fullDocument);

    if (!mongoosePermissions.isJsonValid(fullDocument.toJSON({ virtuals: true }), where)) {
      return;
    }
  }

  const { documentKey, operationType, updateDescription } = payload;
  if (operationType === 'delete') {
    await Model.deleteOne(documentKey);
  } else if (operationType === 'insert') {
    await Model.create(payload.fullDocument);
  } else if (operationType === 'replace') {
    await Model.replaceOne(documentKey, payload.fullDocument, { upsert: true });
  } else if (operationType === 'update') {
    const update = {
      $set: options.useUpdateDescription ? updateDescription.updatedFields : payload.fullDocument,
      $unset: updateDescription.removedFields.reduce((p, c) => ({ ...p, [c]: '' }), {}),
    };

    await Model.updateOne(documentKey, update, { upsert: true });
  }
}
