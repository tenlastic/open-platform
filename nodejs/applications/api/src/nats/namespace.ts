import * as minio from '@tenlastic/minio';
import { createConnection, NamespaceModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent } from '@tenlastic/mongoose-nats';
import * as nats from '@tenlastic/nats';

import { KubernetesNamespace } from '../kubernetes';

// Log the message.
NamespaceEvent.sync(log);

// Update Kubernetes resources.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    NamespaceModel.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesNamespace.upsert(payload.fullDocument);
  }
});

// Clean up services after Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const name = KubernetesNamespace.getName(payload.fullDocument._id);

  const cleanUpMinio = () => minio.removeBucket(name);
  const cleanUpMongo = async () => {
    const connectionString = process.env.MONGO_CONNECTION_STRING;
    const connection = await createConnection({ connectionString, databaseName: name });
    await connection.dropDatabase();
    connection.close();
  };
  const cleanUpNats = () => nats.deleteStream(name);

  await Promise.all([cleanUpMinio(), cleanUpMongo(), cleanUpNats()]);
});
