import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Consumer } from 'kafkajs';
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

export const consumers = new Map<WebSocket, Map<string, Consumer>>();

export async function subscribe(
  auth: AuthenticationData,
  data: SubscribeData,
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
  ws: WebSocket,
) {
  // Initialize the WebSocket's Kafka consumers if not set.
  consumers.set(ws, consumers.has(ws) ? consumers.get(ws) : new Map());

  // Subscribe to Kafka and remember the consumer.
  const consumer = await kafka.watch(
    Model,
    Permissions,
    data.parameters,
    auth.key || auth.jwt.user,
    payload => ws.send(JSON.stringify({ _id: data._id, ...payload })),
    err => {
      console.error(err);

      const { message, name } = err;
      const errors = { errors: [{ message, name }] };
      ws.send(JSON.stringify(errors));
    },
  );
  consumers.get(ws).set(data._id, consumer);

  // Disconnect the Kafka consumer on WebSocket disconnect.
  ws.on('close', () => unsubscribe(auth, data, ws));
}
