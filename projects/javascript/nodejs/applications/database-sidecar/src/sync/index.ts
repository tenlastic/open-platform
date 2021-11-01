import { databaseService, namespaceService } from '@tenlastic/http';
import { Database, Namespace } from '@tenlastic/mongoose-models';

const { _id, namespaceId } = JSON.parse(process.env.DATABASE_JSON);

export async function sync() {
  try {
    // Fetch Namespace from API and MongoDB.
    let localNamespace = await Namespace.findOne({ _id: namespaceId });
    const namespace = await namespaceService.findOne(namespaceId);

    // Fetch Database from API and MongoDB.
    let localDatabase = await Database.findOne({ _id });
    const database = await databaseService.findOne(_id);

    // Create or update Namespace.
    console.log('Updating Namespace...');
    localNamespace = localNamespace ? localNamespace.set(namespace) : new Namespace(namespace);
    await localNamespace.save();
    console.log('Namespace updated successfully.');

    // Create or update Database.
    console.log('Updating Database...');
    localDatabase = localDatabase ? localDatabase.set(database) : new Database(database);
    await localDatabase.save();
    console.log('Database updated successfully.');

    // Update Namespace on NamespaceService changes.
    namespaceService.emitter.on('update', async (n) => {
      console.log('Updating Namespace...');
      localNamespace.set(n);
      await localNamespace.save();
      console.log('Namespace updated successfully.');
    });

    // Update Database on DatabaseService changes.
    databaseService.emitter.on('update', async (n) => {
      console.log('Updating Database...');
      localDatabase.set(n);
      await localDatabase.save();
      console.log('Database updated successfully.');
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
