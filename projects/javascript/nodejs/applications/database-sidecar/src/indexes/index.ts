import * as mongooseModels from '@tenlastic/mongoose-models';

export async function indexes() {
  try {
    console.log('Syncing indexes...');
    await mongooseModels.Collection.syncIndexes({ background: true });
    await mongooseModels.WebSocket.syncIndexes({ background: true });
    console.log('Indexes synced successfully!');

    // Run every 24 hours.
    setTimeout(indexes, 24 * 60 * 60);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
