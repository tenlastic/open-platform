import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, plugin, prop } from 'typegoose';

import { EventEmitter } from '..';
import { IDatabasePayload, changeStreamPlugin } from './plugin';

export const ChangeDataCaptureEvent = new EventEmitter<
  IDatabasePayload<ChangeDataCaptureDocument>
>();

@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ChangeDataCaptureEvent,
  fetchFullDocumentOnSave: true,
})
export class ChangeDataCaptureSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public age: number;

  public createdAt: Date;

  @prop()
  public name: string;

  public updatedAt: Date;
}

export type ChangeDataCaptureDocument = InstanceType<ChangeDataCaptureSchema>;
export type ChangeDataCaptureModel = ModelType<ChangeDataCaptureSchema>;
export const ChangeDataCapture = new ChangeDataCaptureSchema().getModelForClass(
  ChangeDataCaptureSchema,
  {
    schemaOptions: {
      collection: 'changedatacaptures',
      timestamps: true,
    },
  },
);
