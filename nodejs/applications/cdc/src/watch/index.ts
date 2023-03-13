import { DatabasePayload } from '@tenlastic/mongoose-nats';
import * as nats from '@tenlastic/nats';
import Redis from 'ioredis';
import { ChangeStream } from 'mongodb';
import * as mongoose from 'mongoose';

interface ChangeStreamDocument {
  _id: { _data: string };
  clusterTime: { $timestamp: string };
  documentKey: { [key: string]: any };
  fullDocument?: any;
  fullDocumentBeforeChange?: any;
  ns: { coll: string; db: string };
  operationType: 'delete' | 'insert' | 'replace' | 'update';
  updateDescription?: { removedFields: string[]; updatedFields: { [key: string]: any } };
  wallTime: Date;
}

export function watch(
  client: Redis,
  collections: string[],
  connection: mongoose.Connection,
  key: string,
  resumeAfter: string,
) {
  const pipeline = collections?.length ? [{ $match: { 'db.coll': { $in: collections } } }] : [];
  const changeStream = connection.db.watch(pipeline, {
    fullDocument: 'updateLookup',
    fullDocumentBeforeChange: 'whenAvailable',
    resumeAfter: resumeAfter ? { _data: resumeAfter } : null,
  });

  changeStream.on('change', async (change: ChangeStreamDocument) => {
    try {
      if (!['delete', 'insert', 'replace', 'update'].includes(change.operationType)) {
        await client.set(key, change._id._data);
        return;
      }

      if (process.env.NODE_ENV !== 'test') {
        const { documentKey, ns, operationType } = change;
        console.log({ documentKey, ns, operationType });
      }

      const message: DatabasePayload<any> = {
        documentKey: change.documentKey,
        fullDocument: change.fullDocument ?? change.fullDocumentBeforeChange,
        ns: change.ns,
        operationType: change.operationType,
      };

      if (change.updateDescription) {
        message.updateDescription = change.updateDescription;
      }

      const subject = `${change.ns.db}.${change.ns.coll}`;
      await nats.publish(subject, message);

      await client.set(key, change._id._data);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
  changeStream.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  return changeStream as ChangeStream;
}
