import * as mongoose from 'mongoose';
import { EventEmitter } from '../';

export interface DatabasePayload<T> {
  after: Partial<T>;
  before: Partial<T>;
}

export interface IChangeDataCapture<T> {
  OnCreate: EventEmitter<DatabasePayload<T>>;
  OnDelete: EventEmitter<DatabasePayload<T>>;
  OnUpdate: EventEmitter<DatabasePayload<T>>;
}

export interface IOriginalDocument {
  _original: any;
  wasNew: boolean;
}

/**
 * Mongoose plugin to emit events after database changes.
 */
export function changeDataCapturePlugin<T extends mongoose.Document>(
  schema: mongoose.Schema,
  options: IChangeDataCapture<T>,
) {
  schema.pre('save', function(this: T & IOriginalDocument) {
    this.wasNew = this.isNew;
  });

  schema.post('findOneAndDelete', function(document: T & IOriginalDocument) {
    options.OnDelete.emit({ after: null, before: document });
  });

  schema.post('init', function(this: T & IOriginalDocument) {
    this._original = this.toObject();
  });

  schema.post('remove', function(this: T & IOriginalDocument) {
    options.OnDelete.emit({ after: null, before: this._original });
  });

  schema.post('save', function(this: T & IOriginalDocument) {
    if (this.wasNew) {
      options.OnCreate.emit({ after: this.toObject(), before: null });
    } else {
      options.OnUpdate.emit({ after: this.toObject(), before: this._original });
    }

    this._original = this.toObject();
  });
}
