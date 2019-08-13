import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, plugin } from 'typegoose';

import { EventEmitter } from '../../src';
import { DatabasePayload, changeDataCapturePlugin } from './change-data-capture.plugin';

export const ChangeDataCaptureCreated = new EventEmitter<
  DatabasePayload<ChangeDataCaptureDocument>
>();
export const ChangeDataCaptureDeleted = new EventEmitter<
  DatabasePayload<ChangeDataCaptureDocument>
>();
export const ChangeDataCaptureUpdated = new EventEmitter<
  DatabasePayload<ChangeDataCaptureDocument>
>();

@plugin(changeDataCapturePlugin, {
  OnCreate: ChangeDataCaptureCreated,
  OnDelete: ChangeDataCaptureDeleted,
  OnUpdate: ChangeDataCaptureUpdated,
})
export class ChangeDataCaptureSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;
}

export type ChangeDataCaptureDocument = InstanceType<ChangeDataCaptureSchema>;
export type ChangeDataCaptureModel = ModelType<ChangeDataCaptureSchema>;
export const ChangeDataCapture = new ChangeDataCaptureSchema().getModelForClass(
  ChangeDataCaptureSchema,
  {
    schemaOptions: {
      autoIndex: false,
      collation: {
        locale: 'en_US',
        strength: 1,
      },
      collection: 'changedatacaptures',
      timestamps: true,
    },
  },
);
