import * as mongoose from 'mongoose';
import { EventEmitter } from '..';

export type DatabaseOperationType = 'delete' | 'insert' | 'update';

export interface IDatabasePayload<T> {
  documentKey: any;
  fullDocument?: T;
  ns: { coll: string; db: string };
  operationType: DatabaseOperationType;
  updateDescription?: { removedFields: string[]; updatedFields: { [key: string]: any } };
}

export interface IOptions<T extends mongoose.Document> {
  documentKeys?: string[];
  eventEmitter: EventEmitter<IDatabasePayload<T>>;
  fullDocumentOnSave?: boolean;
}

export interface IOriginalDocument {
  _original: any;
  wasModified: string[];
  wasNew: boolean;
}

/**
 * Mongoose plugin to emit events after database changes.
 */
export function changeStreamPlugin<T extends mongoose.Document>(
  schema: mongoose.Schema,
  options: IOptions<T>,
) {
  schema.pre('findOneAndUpdate', async function(
    this: mongoose.DocumentQuery<mongoose.Document, mongoose.Document, {}>,
  ) {
    const options = this.getOptions();
    this.setOptions({ ...options, new: true });
  });

  schema.pre('save', function(this: T & IOriginalDocument) {
    this.wasModified = this.modifiedPaths();
    this.wasNew = this.isNew;
  });

  schema.post('findOneAndDelete', function(
    this: mongoose.DocumentQuery<mongoose.Document, mongoose.Document, {}>,
    document: T,
  ) {
    const query = this.getQuery();
    const documentKey = options.documentKeys.reduce((agg: any, key: string) => {
      agg[key] = query[key];
      return agg;
    }, {});

    const payload = {
      documentKey,
      ns: { coll: document.collection.name, db: document.db.db.databaseName },
      operationType: 'delete',
    } as IDatabasePayload<T>;
    options.eventEmitter.emit(payload);
  });

  schema.post('findOneAndUpdate', async function(
    this: mongoose.DocumentQuery<mongoose.Document, mongoose.Document, {}>,
    document: T,
  ) {
    const query = this.getQuery();
    const documentKey = options.documentKeys.reduce((agg: any, key: string) => {
      agg[key] = query[key];
      return agg;
    }, {});

    const update = this.getUpdate();
    const removedFields = update.$unset ? Object.keys(update.$unset) : [];
    const updatedFields = update.$set;

    const payload = {
      documentKey,
      fullDocument: document,
      ns: { coll: document.collection.name, db: document.db.db.databaseName },
      operationType: 'update',
      updateDescription: { removedFields, updatedFields },
    } as IDatabasePayload<T>;

    options.eventEmitter.emit(payload);
  });

  schema.post('init', function(this: T & IOriginalDocument) {
    this._original = this.toObject();
  });

  schema.post('remove', async function(this: T & IOriginalDocument) {
    const documentKey = options.documentKeys.reduce((agg: any, key: string) => {
      agg[key] = this[key];
      return agg;
    }, {});

    const payload = {
      documentKey,
      ns: { coll: this.collection.name, db: this.db.db.databaseName },
      operationType: 'delete',
    } as IDatabasePayload<T>;
    options.eventEmitter.emit(payload);
  });

  schema.post('save', async function(this: T & IOriginalDocument) {
    const documentKey = options.documentKeys.reduce((agg: any, key: string) => {
      agg[key] = this[key];
      return agg;
    }, {});

    const operationType = this.wasNew ? 'insert' : 'update';
    const payload = {
      documentKey,
      ns: { coll: this.collection.name, db: this.db.db.databaseName },
      operationType,
    } as IDatabasePayload<T>;

    // Append the fullDocument field to the payload.
    if (options.fullDocumentOnSave) {
      let fullDocument: T = this;

      if (operationType === 'update') {
        const Model = this.constructor as mongoose.Model<T>;
        fullDocument = await Model.findOne(documentKey);
      }

      payload.fullDocument = fullDocument;
    }

    // Append the updateDescription field to the payload.
    if (operationType === 'update') {
      const updatedFields = this.wasModified.reduce((agg: any, key: string) => {
        agg[key] = this[key];
        return agg;
      }, {});

      payload.updateDescription = { removedFields: [], updatedFields };
    }

    options.eventEmitter.emit(payload);

    this._original = this.toObject();
  });
}
