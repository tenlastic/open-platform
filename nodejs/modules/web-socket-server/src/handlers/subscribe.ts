import {
  DatabaseOperationType,
  DatabasePayload,
  UpdateDescription,
} from '@tenlastic/mongoose-nats';
import * as permissions from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy, ConsumerConfig, DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';

import { Context, Response, StatusCode } from '../definitions';
import { deleteAckCallback, setAckCallback } from './ack';
import { deleteNakCallback, setNakCallback } from './nak';
import { deleteUnsubscribeCallback, setUnsubscribeCallback } from './unsubscribe';

export interface SubscribeOptions<TDocument extends mongoose.Document> {
  operationType?: DatabaseOperationType[];
  resumeToken?: string;
  startDate?: string;
  where?: mongoose.FilterQuery<TDocument>;
}

export async function subscribe<TDocument extends mongoose.Document>(
  ctx: Context<SubscribeOptions<TDocument>>,
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  const { _id } = ctx.request;
  const body: SubscribeOptions<TDocument> = { ...ctx.request.body };
  const context = { credentials: { ...ctx.state }, Model, options };

  // Compose the subject from database and collection.
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const subject = `${db}.${coll}`;

  // Generate group ID for NATS consumer.
  const resumeToken = body?.resumeToken || new mongoose.Types.ObjectId();
  const username = context.credentials.apiKey || context.credentials.user?.username;
  const durable = `${subject}-${username}-${resumeToken}`.replace(/\./g, '-');

  const wait = 60 * 1000;
  const consumerConfiguration: Partial<ConsumerConfig> = {
    ack_policy: AckPolicy.All,
    ack_wait: wait * 1000 * 1000,
    durable_name: durable,
    inactive_threshold: 1 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_batch: 1,
    max_deliver: 3,
  };

  if (body.startDate) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const startDate = new Date(body.startDate);

    // Limit Start Date to within the past hour to prevent too many initial messages.
    if (startDate.getTime() >= oneHourAgo) {
      consumerConfiguration.deliver_policy = DeliverPolicy.StartTime;
      consumerConfiguration.opt_start_time = startDate.toISOString();
    }
  }

  // Create a NATS consumer.
  const subscription = await nats.subscribe(subject, consumerConfiguration);

  // Register unsubscribe callback.
  setUnsubscribeCallback(_id, () => subscription.stop(), ctx.ws);

  // Disconnect the NATS consumer on WebSocket disconnect.
  ctx.ws.on('close', () => {
    deleteAckCallback(_id, ctx.ws);
    deleteNakCallback(_id, ctx.ws);
    deleteUnsubscribeCallback(_id, ctx.ws);

    subscription.stop();
  });

  // Parse messages asynchronously so we don't block the request.
  setTimeout(async () => {
    for await (const message of subscription) {
      try {
        const decoding = new TextDecoder().decode(message.data);
        const payload = JSON.parse(decoding) as DatabasePayload<TDocument>;
        const document = new Model(payload.fullDocument);

        // Filter by operation type.
        if (body.operationType && !body.operationType.includes(payload.operationType)) {
          continue;
        }

        // Handle the where clause.
        const json = document.toJSON({ flattenMaps: true, getters: true, virtuals: true });
        const where = await permissions.where(context, body?.where || {});
        if (!permissions.isJsonValid(json, where)) {
          continue;
        }

        // Strip document of unauthorized information.
        const fullDocument = await permissions.read(context, document);

        // Strip update description of unauthorized information.
        let updateDescription: UpdateDescription<TDocument>;
        if (payload.updateDescription) {
          const fieldPermissions = await permissions.getFieldPermissions(context, 'read', document);
          const { removedFields, updatedFields } = payload.updateDescription;

          updateDescription = {
            removedFields: removedFields.filter((rf) => fieldPermissions.includes(rf)),
            updatedFields: permissions.filterObject('read', updatedFields, fieldPermissions),
          };
        }

        // Send the result.
        const result: Response = {
          _id,
          body: {
            fullDocument,
            operationType: payload.operationType,
            resumeToken,
            updateDescription,
          },
          status: StatusCode.PartialContent,
        };
        ctx.ws.send(result);

        // Register ack and nak callbacks for client to trigger manually.
        setAckCallback(_id, () => message.ack(), ctx.ws);
        setNakCallback(_id, () => message.nak(), ctx.ws);
      } catch (e) {
        console.error(e);

        const errors = [{ message: e.message, name: e.name }];
        ctx.ws.send({ _id, body: { errors }, status: StatusCode.BadRequest });

        message.nak();
      }
    }
  }, 0);

  ctx.response.status = StatusCode.Accepted;
}
