import { namespaceService } from '@tenlastic/http';
import { connect, Namespace, syncIndexes } from '@tenlastic/mongoose-models';

const namespaceId = JSON.parse(process.env.NAMESPACE_ID);
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

export async function mongodb() {
  try {
    // Connect to MongoDB.
    console.log('Connecting to MongoDB...');
    await connect({ connectionString: mongoConnectionString, databaseName: 'api' });

    // Background Tasks.
    await indexes();
    await sync();
  } catch (e) {
    console.error(e.message);
  }
}

async function indexes() {
  try {
    console.log('Syncing indexes...');
    await syncIndexes();
    console.log('Indexes synced successfully!');

    // Run every 24 hours.
    setTimeout(indexes, 24 * 60 * 60 * 1000);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

async function sync() {
  try {
    // Fetch Namespace from API and MongoDB.
    let localNamespace = await Namespace.findOne({ _id: namespaceId });
    const namespace = await namespaceService.findOne(namespaceId);

    // Create or update Namespace.
    console.log('Updating Namespace...');
    localNamespace = localNamespace ? localNamespace.set(namespace) : new Namespace(namespace);
    await localNamespace.save();
    console.log('Namespace updated successfully.');

    // Update Namespace on NamespaceService changes.
    namespaceService.emitter.on('update', async (n) => {
      console.log('Updating Namespace...');
      localNamespace.set(n);
      await localNamespace.save();
      console.log('Namespace updated successfully.');
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
