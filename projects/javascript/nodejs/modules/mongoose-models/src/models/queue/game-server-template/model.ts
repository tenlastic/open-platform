import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { namespaceValidator } from '../../../validators';
import { BuildDocument } from '../../build';
import { NamespaceDocument } from '../../namespace';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerTemplateSchema {
  @prop({
    ref: 'BuildSchema',
    required: true,
    validate: namespaceValidator('gameServerTemplate.buildDocument', 'gameServerTemplate.buildId'),
  })
  public buildId: Ref<BuildDocument>;

  @prop({ min: 0, required: true })
  public cpu: number;

  @prop()
  public description: string;

  @prop({ min: 0, required: true })
  public memory: number;

  @prop({ default: {} })
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
