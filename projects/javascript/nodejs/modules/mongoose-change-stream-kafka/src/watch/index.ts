import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { isJsonValid, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { connection } from '../connect';

export interface WatchQuery {
  resumeToken: string;
  watch: any;
}

export async function watch(
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
  query: WatchQuery,
  user: any,
  onChange: (payload: any) => void,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const topic = `${db}.${coll}`;

  const resumeToken = query.resumeToken ? query.resumeToken : mongoose.Types.ObjectId();
  const groupId = `${user.username}-${resumeToken}`;

  const consumer = connection.consumer({ groupId });
  await consumer.connect();

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: async data => {
      try {
        const value = data.message.value.toString();
        const json = JSON.parse(value) as IDatabasePayload<any>;

        const where = await Permissions.where(query.watch || {}, user);

        if (isJsonValid(json.fullDocument, where)) {
          const fullDocument = await Permissions.read(json.fullDocument, user);
          const payload = {
            fullDocument,
            operationType: json.operationType,
            resumeToken,
            updateDescription: json.updateDescription,
          };

          onChange(payload);
        }
      } catch (e) {
        console.error(e);
      }
    },
  });

  return consumer;
}
