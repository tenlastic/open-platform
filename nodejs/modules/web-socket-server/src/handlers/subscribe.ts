import {
  IDatabasePayload,
  DatabaseOperationType,
  Authorization,
  AuthorizationDocument,
  User,
} from '@tenlastic/mongoose-models';
import {
  filterObject,
  ICredentials,
  isJsonValid,
  MongoosePermissions,
} from '@tenlastic/mongoose-permissions';
import nats from '@tenlastic/nats';
import { AckPolicy, JetStreamSubscription } from 'nats';
import * as mongoose from 'mongoose';

import { AuthenticationData, WebSocket } from '../web-socket-server';
import { unsubscribe } from './unsubscribe';
import { TextDecoder } from 'util';

export interface SubscribeData {
  _id: string;
  method: string;
  parameters?: SubscribeDataParameters;
}

export interface SubscribeDataParameters {
  collection: string;
  operationType?: DatabaseOperationType[];
  resumeToken: string;
  where: any;
}

export const subscriptions = new Map<WebSocket, Map<string, JetStreamSubscription>>();

export async function subscribe(
  auth: AuthenticationData,
  data: SubscribeData,
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
  ws: WebSocket,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const subject = `${db}.${coll}`;

  let authorization: AuthorizationDocument;
  if (auth.apiKey) {
    authorization = await Authorization.findOne({ apiKey: auth.apiKey });
  } else if (auth.jwt?.authorization) {
    authorization = Authorization.hydrate(auth.jwt.authorization);
  } else if (auth.jwt?.user) {
    authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: auth.jwt?.user?._id,
    });
  }
  const user = auth.jwt?.user ? User.hydrate(auth.jwt.user) : null;

  // Generate group ID for NATS consumer.
  const credentials: ICredentials = { apiKey: auth.apiKey, authorization, user };
  const resumeToken = data.parameters.resumeToken || new mongoose.Types.ObjectId();
  const username = credentials.apiKey || user?.username;
  const durable = `${subject}-${username}-${resumeToken}`.replace(/\./g, '-');

  // Create a NATS consumer.
  const subscription = await nats.subscribe(durable, subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    max_deliver: 3,
  });

  // Cache the consumer.
  subscriptions.set(ws, subscriptions.has(ws) ? subscriptions.get(ws) : new Map());
  subscriptions.get(ws).set(data._id, subscription);

  // Disconnect the NATS consumer on WebSocket disconnect.
  ws.on('close', () => unsubscribe(auth, data, ws));

  for await (const message of subscription) {
    try {
      const decoding = new TextDecoder().decode(message.data);
      const json = JSON.parse(decoding) as IDatabasePayload<any>;

      // Filter by operation type.
      const { parameters } = data;
      if (parameters.operationType && !parameters.operationType.includes(json.operationType)) {
        continue;
      }

      // Handle the where clause.
      const where = await Permissions.where(credentials, parameters.where || {});
      if (!isJsonValid(json.fullDocument, where)) {
        continue;
      }

      // Strip document of unauthorized information.
      const document = new Model(json.fullDocument);
      const fullDocument = await Permissions.read(credentials, document);

      // Strip update description of unauthorized information.
      let updateDescription;
      if (json.updateDescription) {
        const permissions = await Permissions.getFieldPermissions(credentials, 'read', document);
        const { removedFields, updatedFields } = json.updateDescription;

        updateDescription = {
          removedFields: removedFields.filter((rf) => permissions.includes(rf)),
          updatedFields: filterObject(updatedFields, permissions),
        };
      }

      // Send the result.
      const result = {
        _id: data._id,
        fullDocument,
        operationType: json.operationType,
        resumeToken,
        updateDescription,
      };
      ws.send(JSON.stringify(result));

      message.ack();
    } catch (e) {
      console.error(e);

      const errors = { _id: data._id, errors: [{ message: e.message, name: e.name }] };
      ws.send(JSON.stringify(errors));

      message.nak();
    }
  }
}
