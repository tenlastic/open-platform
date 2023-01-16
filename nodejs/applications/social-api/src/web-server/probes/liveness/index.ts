import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const mongoStatus = await getMongoStatus();
  const natsStatus = await getNatsStatus();

  ctx.response.status = mongoStatus && natsStatus ? 200 : 500;
}

async function getMongoStatus() {
  const { collections, health, primary } = await mongoose.status();
  return collections.length > 0 && health === 1 && primary?.health === 1;
}

async function getNatsStatus() {
  const { health, streams } = await nats.status();
  return health === 1 && streams.length > 0;
}
