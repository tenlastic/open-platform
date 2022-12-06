import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { arrayLengthValidator, duplicateValidator, namespaceValidator } from '../../../validators';
import { BuildDocument } from '../../build';
import {
  GameServerPortDocument,
  GameServerPortModel,
  GameServerPortSchema,
  GameServerProbesDocument,
  GameServerProbesSchema,
} from '../../game-server';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { _id: false } })
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

  @prop({ maxlength: 128, trim: true, type: String })
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop(
    {
      required: true,
      type: GameServerPortSchema,
      validate: [arrayLengthValidator(5, 1), duplicateValidator],
    },
    PropType.ARRAY,
  )
  public ports: GameServerPortDocument[];

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ type: GameServerProbesSchema })
  public probes: GameServerProbesDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof QueueGameServerTemplateModel,
    values: Partial<QueueGameServerTemplateSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 250 * 1000 * 1000 }),
      name: chance.hash(),
      ports: [GameServerPortModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueGameServerTemplateDocument = DocumentType<QueueGameServerTemplateSchema>;
export const QueueGameServerTemplateModel = getModelForClass(QueueGameServerTemplateSchema);
