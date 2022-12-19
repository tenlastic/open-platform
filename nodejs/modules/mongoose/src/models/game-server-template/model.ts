import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { arrayLengthValidator, duplicateValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import {
  GameServerPortDocument,
  GameServerPortModel,
  GameServerPortSchema,
  GameServerProbesDocument,
  GameServerProbesSchema,
} from '../game-server';

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ matchId: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'game-server-templates', timestamps: true },
})
@plugin(unsetPlugin)
export class GameServerTemplateSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ maxlength: 128, trim: true, type: String })
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

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

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerTemplateModel,
    values: Partial<GameServerTemplateSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      ports: [GameServerPortModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerTemplateDocument = DocumentType<GameServerTemplateSchema>;
export const GameServerTemplateModel = getModelForClass(GameServerTemplateSchema);
