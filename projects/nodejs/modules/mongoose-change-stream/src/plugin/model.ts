import { DocumentType, getModelForClass, modelOptions, plugin, prop } from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter } from '..';
import { IDatabasePayload, changeStreamPlugin } from './plugin';

export const ExampleEvent = new EventEmitter<IDatabasePayload<ExampleDocument>>();

@modelOptions({
  schemaOptions: {
    collection: 'examples',
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ExampleEvent,
  fetchFullDocumentOnSave: true,
})
export class ExampleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public age: number;

  public createdAt: Date;

  @prop()
  public name: string;

  public updatedAt: Date;
}

export type ExampleDocument = DocumentType<ExampleSchema>;
export const Example = getModelForClass(ExampleSchema);
