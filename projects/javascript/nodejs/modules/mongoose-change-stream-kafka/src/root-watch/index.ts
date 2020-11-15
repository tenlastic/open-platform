import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { isJsonValid } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { connection } from '../connect';

export async function rootWatch<
  TDocument extends mongoose.Document,
  TModel extends mongoose.Model<TDocument>
>(
  Model: TModel,
  groupId: string,
  where: any,
  onChange: (payload: IDatabasePayload<Partial<TDocument>>) => void,
) {
  const coll = Model.collection.name.replace(/\//g, '.');
  const db = Model.db.db.databaseName;
  const topic = `${db}.${coll}`;

  const consumer = connection.consumer({ groupId });
  await consumer.connect();

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: async data => {
      try {
        const value = data.message.value.toString();
        const json = JSON.parse(value) as IDatabasePayload<any>;

        if (isJsonValid(json.fullDocument, where)) {
          onChange(json);
        }
      } catch (e) {
        console.error(e);
      }
    },
  });

  return consumer;
}
