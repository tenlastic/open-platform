import { namespaceValidator } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { BuildDocument } from '../../build';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false },
})
export class GameServerTemplateSchema {
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

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;
}

export type GameServerTemplateDocument = DocumentType<GameServerTemplateSchema>;
export type GameServerTemplateModel = ReturnModelType<typeof GameServerTemplateSchema>;
export const GameServerTemplate = getModelForClass(GameServerTemplateSchema);
