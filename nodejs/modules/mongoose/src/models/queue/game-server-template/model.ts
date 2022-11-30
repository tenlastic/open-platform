import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../../validators';
import { BuildDocument } from '../../build';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false },
})
export class QueueGameServerTemplateSchema {
  @prop({
    ref: 'BuildSchema',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('gameServerTemplate.buildDocument', 'gameServerTemplate.buildId'),
  })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  @prop({ type: String })
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: QueueGameServerTemplateModel,
    values: Partial<QueueGameServerTemplateSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 250 * 1000 * 1000 }),
      name: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueGameServerTemplateDocument = DocumentType<QueueGameServerTemplateSchema>;
export type QueueGameServerTemplateModel = ReturnModelType<typeof QueueGameServerTemplateSchema>;
export const QueueGameServerTemplate = getModelForClass(QueueGameServerTemplateSchema);
