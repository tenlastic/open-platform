import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { filterObject, isJsonValid, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { connection } from '../connect';

export interface WatchQuery {
  resumeToken: string;
  where: any;
}

export async function watch(
  Model: mongoose.Model<mongoose.Document>,
  Permissions: MongoosePermissions<any>,
  parameters: WatchQuery,
  user: any,
  onChange: (payload: any) => void,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const topic = `${db}.${coll}`;

  const resumeToken = parameters.resumeToken ? parameters.resumeToken : mongoose.Types.ObjectId();
  const username = typeof user === 'string' ? user : user.username;
  const groupId = `${username}-${resumeToken}`;

  const consumer = connection.consumer({ groupId });
  await consumer.connect();

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: async data => {
      try {
        const value = data.message.value.toString();
        const json = JSON.parse(value) as IDatabasePayload<any>;

        const where = await Permissions.where(parameters.where || {}, user);

        if (isJsonValid(json.fullDocument, where)) {
          const document = new Model(json.fullDocument);
          const fullDocument = await Permissions.read(document, user);

          let updateDescription;
          if (json.updateDescription) {
            const { removedFields, updatedFields } = json.updateDescription;

            updateDescription = {
              removedFields: getRemovedFields(Permissions, json.fullDocument, removedFields, user),
              updatedFields: getUpdatedFields(Permissions, json.fullDocument, updatedFields, user),
            };
          }

          const payload = {
            fullDocument,
            operationType: json.operationType,
            resumeToken,
            updateDescription,
          };

          return onChange(payload);
        }
      } catch (e) {
        console.error(e.stack);
      }
    },
  });

  return consumer;
}

function getRemovedFields(
  Permissions: MongoosePermissions<any>,
  record: any,
  removedFields: string[],
  user: any,
) {
  const permissions = Permissions.accessControl.getFieldPermissions('read', record, user);
  return removedFields.filter(rf => permissions.includes(rf));
}

function getUpdatedFields(
  Permissions: MongoosePermissions<any>,
  record: any,
  updatedFields: any,
  user: any,
) {
  const permissions = Permissions.accessControl.getFieldPermissions('read', record, user);
  return filterObject(updatedFields, permissions);
}
