import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, plugin, prop } from 'typegoose';

import { EventEmitter } from '..';
import { IDatabasePayload, changeStreamPlugin } from './plugin';

export const ExampleEvent = new EventEmitter<IDatabasePayload<ExampleDocument>>();

@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ExampleEvent,
  fetchFullDocumentOnSave: true,
})
export class ExampleSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public age: number;

  public createdAt: Date;

  @prop()
  public name: string;

  public updatedAt: Date;
}

export type ExampleDocument = InstanceType<ExampleSchema>;
export type ExampleModel = ModelType<ExampleSchema>;
export const Example = new ExampleSchema().getModelForClass(ExampleSchema, {
  schemaOptions: {
    collection: 'examples',
    timestamps: true,
  },
});
