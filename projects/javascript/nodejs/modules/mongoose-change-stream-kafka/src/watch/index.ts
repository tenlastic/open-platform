import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { isJsonValid, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { connection } from '../connect';

export async function watch(
  Model: any,
  Permissions: MongoosePermissions<any>,
  query: URLSearchParams,
  user: any,
  onChange: (payload: any) => void,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const topic = `${db}.${coll}`;

  const resumeToken = query.get('resumeToken')
    ? query.get('resumeToken')
    : mongoose.Types.ObjectId();
  const groupId = `${user.username}-${resumeToken}`;

  const consumer = connection.consumer({ groupId });
  await consumer.connect();

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: async data => {
      try {
        const value = data.message.value.toString();
        const json = JSON.parse(value) as IDatabasePayload<any>;

        const where = await Permissions.where(
          query.get('watch') ? JSON.parse(query.get('watch')) : {},
          user,
        );

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
