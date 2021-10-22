import { namespaceService, setAccessToken, setApiUrl, WebSocket } from '@tenlastic/http';
import { Namespace } from '@tenlastic/mongoose-models';

const database = JSON.parse(process.env.DATABASE_JSON);

export async function namespace() {
  try {
    // Fetch Namespace from API and MongoDB.
    let record = await Namespace.findOne({ _id: database.namespaceId });
    const response = await namespaceService.findOne(database.namespaceId);

    // Create or update Namespace.
    console.log('Updating Namespace...');
    record = record ? record.set(response) : new Namespace(response as any);
    await record.save();
    console.log('Namespace updated successfully.');

    // Update Namespace on NamespaceService changes.
    namespaceService.emitter.on('update', async n => {
      console.log('Updating Namespace...');
      record.set(n);
      await record.save();
      console.log('Namespace updated successfully.');
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
