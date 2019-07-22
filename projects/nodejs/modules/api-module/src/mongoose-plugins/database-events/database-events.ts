import * as mongoose from 'mongoose';

import { EventEmitter } from '../../classes';

export interface DatabasePayload<T> {
  after: Partial<T>;
  before: Partial<T>;
}

export interface IOriginalDocument {
  _original: any;
}

export function databaseEventsPlugin(schema: mongoose.Schema) {
  schema.post('init', function(this: mongoose.Document & IOriginalDocument) {
    this._original = this.toObject();
  });

  schema.post('remove', function(this: mongoose.Document & IOriginalDocument) {
    this.schema.statics.OnDelete.emit({ after: null, before: this._original });
  });

  schema.post('save', function(this: mongoose.Document & IOriginalDocument) {
    if (this.isNew) {
      this.schema.statics.OnCreate.emit({ after: this.toObject(), before: null });
    } else {
      this.schema.statics.OnUpdate.emit({ after: this.toObject(), before: this._original });
    }
  });
}
