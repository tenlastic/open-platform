import { namespaceService, setAccessToken, setApiUrl, WebSocket } from '@tenlastic/http';
import { Namespace } from '@tenlastic/mongoose-models';

const accessToken = process.env.ACCESS_TOKEN;
const apiUrl = process.env.API_URL;
const database = JSON.parse(process.env.DATABASE_JSON);
const wssUrl = process.env.WSS_URL;

export async function namespace() {
  try {
    setAccessToken(accessToken);
    setApiUrl(apiUrl);

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

    // Open WebSocket for Namespace.
    const webSocket = new WebSocket();
    webSocket.emitter.on('open', () => {
      console.log('Web socket connected.');

      webSocket.subscribe(namespaceService.emitter, {
        collection: 'namespaces',
        resumeToken: 'database-sidecar',
        where: { _id: record._id },
      });
    });
    await webSocket.connect(wssUrl);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
