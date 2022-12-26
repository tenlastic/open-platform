import {
  DatabasePayload,
  DatabaseOperationType,
  UpdateDescription,
} from '@tenlastic/mongoose-nats';
import {
  filterObject,
  ICredentials,
  isJsonValid,
  MongoosePermissions,
} from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import { AckPolicy } from 'nats';
import * as mongoose from 'mongoose';
import { TextDecoder } from 'util';

import { Context, Response, StatusCode } from '../definitions';
import { deleteAckCallback, setAckCallback } from './ack';
import { deleteNakCallback, setNakCallback } from './nak';
import { deleteUnsubscribeCallback, setUnsubscribeCallback } from './unsubscribe';

export interface SubscribeOptions {
  operationType?: DatabaseOperationType[];
  resumeToken?: string;
  where?: any;
}

export async function subscribe(
  ctx: Context,
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
) {
  const { _id } = ctx.request;
  const credentials: ICredentials = { ...ctx.state };
  const options: SubscribeOptions = { ...ctx.request.body };

  // Compose the subject from database and collection.
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const subject = `${db}.${coll}`;

  // Generate group ID for NATS consumer.
  const resumeToken = options?.resumeToken || new mongoose.Types.ObjectId();
  const username = credentials.apiKey || credentials.user?.username;
  const durable = `${subject}-${username}-${resumeToken}`.replace(/\./g, '-');

  // Create a NATS consumer.
  const wait = 60 * 1000;
  const subscription = await nats.subscribe(subject, {
    ack_policy: AckPolicy.All,
    ack_wait: wait * 1000 * 1000,
    durable_name: durable,
    inactive_threshold: 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 3,
  });

  // Register unsubscribe callback.
  setUnsubscribeCallback(_id, () => subscription.unsubscribe(), ctx.ws);

  // Disconnect the NATS consumer on WebSocket disconnect.
  ctx.ws.on('close', () => {
    deleteAckCallback(_id, ctx.ws);
    deleteNakCallback(_id, ctx.ws);
    deleteUnsubscribeCallback(_id, ctx.ws);

    subscription.unsubscribe();
  });

  // Parse messages asynchronously so we don't block the request.
  setTimeout(async () => {
    for await (const message of subscription) {
      try {
        const decoding = new TextDecoder().decode(message.data);
        const json = JSON.parse(decoding) as DatabasePayload<any>;

        // Filter by operation type.
        if (options?.operationType && !options?.operationType.includes(json.operationType)) {
          continue;
        }

        // Handle the where clause.
        const document = new Model(json.fullDocument);
        const where = await Permissions.where(credentials, options?.where || {});

        if (!isJsonValid(document.toJSON({ virtuals: true }), where)) {
          continue;
        }

        // Strip document of unauthorized information.
        const fullDocument = await Permissions.read(credentials, document);

        // Strip update description of unauthorized information.
        let updateDescription: UpdateDescription;
        if (json.updateDescription) {
          const permissions = await Permissions.getFieldPermissions(credentials, 'read', document);
          const { removedFields, updatedFields } = json.updateDescription;

          updateDescription = {
            removedFields: removedFields.filter((rf) => permissions.includes(rf)),
            updatedFields: filterObject('read', updatedFields, permissions),
          };
        }

        // Send the result.
        const result: Response = {
          _id,
          body: { fullDocument, operationType: json.operationType, resumeToken, updateDescription },
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
