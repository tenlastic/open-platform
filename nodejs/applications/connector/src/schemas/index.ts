import { jsonToMongoose, SchemaDocument, SchemaSchema } from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import { ReturnModelType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';
import { AckPolicy, DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';

const from: { [key: string]: mongoose.Model<mongoose.Document> } = {};
const to: { [key: string]: mongoose.Model<mongoose.Document> } = {};

export function getFromModel(collection: string) {
  return from[collection];
}

export function getToModel(collection: string) {
  return to[collection];
}

export async function fetchSchemasFromMongo(
  SchemaModel: ReturnModelType<typeof SchemaSchema>,
  toConnection: mongoose.Connection,
) {
  const schemas = await SchemaModel.find().lean();

  if (schemas.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchSchemasFromMongo(SchemaModel, toConnection);
  }

  schemas.forEach((s) => setModel(SchemaModel.db, s, toConnection));
}

export async function fetchSchemasFromNats(
  databaseName: string,
  durable: string,
  fromConnection: mongoose.Connection,
  start: Date,
  toConnection: mongoose.Connection,
) {
  const subscription = await nats.subscribe(`${databaseName}.schemas`, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    deliver_policy: DeliverPolicy.StartTime,
    durable_name: durable,
    max_deliver: 5,
    opt_start_time: start.toISOString(),
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    try {
      if (['insert', 'replace', 'update'].includes(json.operationType)) {
        setModel(fromConnection, json.fullDocument, toConnection);
      }

      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();

      process.exit(1);
    }
  }
}

function setModel(
  fromConnection: mongoose.Connection,
  json: mongoose.LeanDocument<SchemaDocument>,
  toConnection: mongoose.Connection,
) {
  const name = `${json.name}.${json.__v}`;
  const schema = jsonToMongoose(json, { collection: json.name });

  from[json.name] = fromConnection.models[name] ?? fromConnection.model(name, schema);
  to[json.name] = toConnection.models[name] ?? toConnection.model(name, schema);
}
