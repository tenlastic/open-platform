import * as mongooseModels from '@tenlastic/mongoose-models';

export async function indexes() {
  try {
    console.log('Syncing indexes...');
    await mongooseModels.Collection.syncIndexes({ background: true });
    await mongooseModels.WebSocket.syncIndexes({ background: true });
    console.log('Indexes synced successfully!');

    // Run every 24 hours.
    setTimeout(indexes, 24 * 60 * 60 * 1000);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
