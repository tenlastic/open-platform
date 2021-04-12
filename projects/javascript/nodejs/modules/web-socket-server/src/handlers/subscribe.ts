import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/kafka';
import { filterObject, isJsonValid, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { AuthenticationData, WebSocket } from '../web-socket-server';
import { unsubscribe } from './unsubscribe';

export interface SubscribeData {
  _id: string;
  method: string;
  parameters: SubscribeDataParameters;
}

export interface SubscribeDataParameters {
  collection: string;
  resumeToken: string;
  where: any;
}

export const consumers = new Map<WebSocket, Map<string, kafka.Consumer>>();

export async function subscribe(
  auth: AuthenticationData,
  data: SubscribeData,
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
  ws: WebSocket,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const topic = `${db}.${coll}`;
  const user = auth.key || auth.jwt.user;

  // Generate group ID for Kafka consumer.
  const resumeToken = data.parameters.resumeToken || mongoose.Types.ObjectId();
  const username = typeof user === 'string' ? user : user.username;
  const groupId = `${username}-${resumeToken}`;

  // Create a Kafka consumer.
  const connection = kafka.getConnection();
  const consumer = connection.consumer({ groupId });
  await consumer.connect();

  // Cache the consumer.
  consumers.set(ws, consumers.has(ws) ? consumers.get(ws) : new Map());
  consumers.get(ws).set(data._id, consumer);

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: async payload => {
      try {
        const value = payload.message.value.toString();
        const json = JSON.parse(value) as IDatabasePayload<any>;

        // Handle the where clause.
        const where = await Permissions.where(data.parameters.where || {}, user);
        if (!isJsonValid(json.fullDocument, where)) {
          return;
        }

        // Strip document of unauthorized information.
        const { accessControl } = Permissions;
        const document = await new Model(json.fullDocument)
          .populate(accessControl.options.populate || [])
          .execPopulate();
        const fullDocument = await Permissions.read(document, user);

        // Strip update description of unauthorized information.
        let updateDescription;
        if (json.updateDescription) {
          const permissions = accessControl.getFieldPermissions('read', json.fullDocument, user);
          const { removedFields, updatedFields } = json.updateDescription;

          updateDescription = {
            removedFields: removedFields.filter(rf => permissions.includes(rf)),
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

        const { message, name } = e;
        const errors = { errors: [{ message, name }] };
        ws.send(JSON.stringify(errors));
      }
    },
  });

  // Disconnect the Kafka consumer on WebSocket disconnect.
  ws.on('close', () => unsubscribe(auth, data, ws));
}
