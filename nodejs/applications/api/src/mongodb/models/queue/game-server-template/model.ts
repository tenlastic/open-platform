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
import { NamespaceDocument } from '../../namespace';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false },
})
export class GameServerTemplateSchema {
  @prop({
    ref: 'BuildSchema',
    required: true,
    validate: namespaceValidator('gameServerTemplate.buildDocument', 'gameServerTemplate.buildId'),
  })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true })
  public cpu: number;

  @prop()
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true })
  public memory: number;

  @prop()
  public metadata: any;

  @prop()
  public preemptible: boolean;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type GameServerTemplateDocument = DocumentType<GameServerTemplateSchema>;
export type GameServerTemplateModel = ReturnModelType<typeof GameServerTemplateSchema>;
export const GameServerTemplate = getModelForClass(GameServerTemplateSchema);
