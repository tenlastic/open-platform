import { IDatabasePayload, DatabaseOperationType, Authorization } from '@tenlastic/mongoose-models';
import { filterObject, isJsonValid, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import nats from '@tenlastic/nats';
import { JetStreamSubscription } from 'nats';
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

  // Generate group ID for NATS consumer.
  const authorization = await Authorization.findOne({
    namespaceId: { $exists: false },
    userId: auth.jwt?.user?._id,
  });
  const credentials = { apiKey: auth.key, authorization, user: auth.jwt.user };
  const resumeToken = data.parameters.resumeToken || new mongoose.Types.ObjectId();
  const username = credentials.apiKey || credentials.user.username;
  const durable = `${subject}-${username}-${resumeToken}`.replace(/\./g, '-');

  // Create a NATS consumer.
  const subscription = await nats.subscribe(durable, subject);

  // Cache the consumer.
  subscriptions.set(ws, subscriptions.has(ws) ? subscriptions.get(ws) : new Map());
  subscriptions.get(ws).set(data._id, subscription);

  // Disconnect the NATS consumer on WebSocket disconnect.
  ws.on('close', () => unsubscribe(auth, data, ws));

  for await (const message of subscription) {
    try {
      const decoding = new TextDecoder().decode(message.data);
      const json = JSON.parse(decoding) as IDatabasePayload<any>;

      console.log(json.operationType);

      // Filter by operation type.
      const { parameters } = data;
      if (parameters.operationType && !parameters.operationType.includes(json.operationType)) {
        continue;
      }

      // Handle the where clause.
      const where = await Permissions.where(credentials, parameters.where || {});
      if (!isJsonValid(json.fullDocument, where)) {
        console.log('JSON is invalid.');
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
    } catch (e) {
      console.error(e);

      const errors = { _id: data._id, errors: [{ message: e.message, name: e.name }] };
      ws.send(JSON.stringify(errors));
    }
  }
}
