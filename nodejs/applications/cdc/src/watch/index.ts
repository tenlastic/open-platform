import { ChangeStreamModel } from '@tenlastic/mongoose';
import { DatabasePayload } from '@tenlastic/mongoose-nats';
import * as nats from '@tenlastic/nats';
import { ChangeStream, MongoChangeStreamError } from 'mongodb';
import { Connection } from 'mongoose';

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
  collections: string[],
  connection: Connection,
  key: string,
  resumeAfter: string,
) {
  const filter = { key };

  const pipeline = collections?.length
    ? [{ $match: { 'ns.coll': { $in: collections } } }]
    : [{ $match: { 'ns.coll': { $ne: 'change-streams' } } }];
  const changeStream = connection.db.watch(pipeline, {
    fullDocument: 'updateLookup',
    fullDocumentBeforeChange: 'whenAvailable',
    resumeAfter: resumeAfter ? { _data: resumeAfter } : null,
  });

  changeStream.on('change', async (change: ChangeStreamDocument) => {
    try {
      const update = { key, resumeToken: change._id._data };

      if (!['delete', 'insert', 'replace', 'update'].includes(change.operationType)) {
        await ChangeStreamModel.updateOne(filter, update, { upsert: true });
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

      await ChangeStreamModel.updateOne(filter, update, { upsert: true });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
  changeStream.on('error', async (err: MongoChangeStreamError) => {
    console.error(err);

    // Delete Change Stream from MongoDB if ChangeStreamFatalError
    // or ChangeStreamHistoryLost is received.
    if (err.code === 280 || err.code === 286) {
      await ChangeStreamModel.deleteOne({ key });
    }

    process.exit(1);
  });

  return changeStream as ChangeStream;
}
